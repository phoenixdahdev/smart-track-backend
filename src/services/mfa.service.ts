import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserDal } from '@dals/user.dal';
import { MfaType } from '@enums/mfa-type.enum';
import { TokenService } from './token.service';
import { EncryptionService } from './encryption.service';
import { EmailService } from './email.service';
import { AuditLogService } from './audit-log.service';

const MFA_OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const BACKUP_CODE_COUNT = 10;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(
    private readonly userDal: UserDal,
    private readonly tokenService: TokenService,
    private readonly encryptionService: EncryptionService,
    private readonly emailService: EmailService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async setupTotp(userId: string) {
    const user = await this.userDal.get({
      identifierOptions: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.mfa_enabled) {
      throw new BadRequestException(
        'MFA is already enabled. Disable it first to change method.',
      );
    }

    const secret = generateSecret();
    const encryptedSecret = this.encryptionService.encrypt(secret);

    await this.userDal.update({
      identifierOptions: { id: userId },
      updatePayload: { mfa_secret: encryptedSecret },
      transactionOptions: { useTransaction: false },
    });

    const otpauthUri = generateURI({
      issuer: 'SmartTrack Health',
      label: user.email,
      secret,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);

    return { secret, otpauthUri, qrCodeDataUrl };
  }

  async confirmTotpSetup(
    userId: string,
    code: string,
    ip: string,
    userAgent: string,
  ) {
    const user = await this.userDal.get({
      identifierOptions: { id: userId },
    });

    if (!user || !user.mfa_secret) {
      throw new BadRequestException(
        'TOTP setup not initiated. Call /totp/setup first.',
      );
    }

    if (user.mfa_enabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    const secret = this.encryptionService.decrypt(user.mfa_secret);
    const result = verifySync({ secret, token: code, epochTolerance: 30 });
    const isValid = result.valid;

    if (!isValid) {
      throw new BadRequestException('Invalid TOTP code');
    }

    const { plaintext, hashed } = await this.generateBackupCodes();

    await this.userDal.update({
      identifierOptions: { id: userId },
      updatePayload: {
        mfa_enabled: true,
        mfa_type: MfaType.TOTP,
        mfa_backup_codes: hashed,
        mfa_failed_attempts: 0,
        mfa_locked_until: null,
      },
      transactionOptions: { useTransaction: false },
    });

    await this.logMfaEvent(user, 'MFA_TOTP_SETUP', ip, userAgent);

    return { backupCodes: plaintext };
  }

  async setupEmailOtp(userId: string, ip: string, userAgent: string) {
    const user = await this.userDal.get({
      identifierOptions: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.mfa_enabled) {
      throw new BadRequestException(
        'MFA is already enabled. Disable it first to change method.',
      );
    }

    const { plaintext, hashed } = await this.generateBackupCodes();

    await this.userDal.update({
      identifierOptions: { id: userId },
      updatePayload: {
        mfa_enabled: true,
        mfa_type: MfaType.EMAIL_OTP,
        mfa_secret: null,
        mfa_backup_codes: hashed,
        mfa_failed_attempts: 0,
        mfa_locked_until: null,
      },
      transactionOptions: { useTransaction: false },
    });

    await this.logMfaEvent(user, 'MFA_EMAIL_OTP_SETUP', ip, userAgent);

    return { backupCodes: plaintext };
  }

  async sendMfaEmailOtp(userId: string) {
    const user = await this.userDal.get({
      identifierOptions: { id: userId },
    });

    if (!user || !user.mfa_enabled || user.mfa_type !== MfaType.EMAIL_OTP) {
      return;
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    await this.userDal.update({
      identifierOptions: { id: userId },
      updatePayload: {
        mfa_otp_code: otp,
        mfa_otp_expires_at: new Date(Date.now() + MFA_OTP_EXPIRY_MS),
      },
      transactionOptions: { useTransaction: false },
    });

    await this.emailService.sendMfaOtp(user.email, user.name, otp);
  }

  async verifyMfa(
    userId: string,
    code: string,
    ip: string,
    userAgent: string,
  ) {
    const user = await this.userDal.get({
      identifierOptions: { id: userId },
    });

    if (!user || !user.mfa_enabled) {
      throw new UnauthorizedException('MFA is not enabled');
    }

    this.checkLockout(user.mfa_locked_until);

    let isValid = false;

    if (user.mfa_type === MfaType.TOTP) {
      if (!user.mfa_secret) {
        throw new UnauthorizedException('TOTP not configured');
      }
      const secret = this.encryptionService.decrypt(user.mfa_secret);
      const totpResult = verifySync({ secret, token: code, epochTolerance: 30 });
      isValid = totpResult.valid;
    } else if (user.mfa_type === MfaType.EMAIL_OTP) {
      if (
        !user.mfa_otp_code ||
        !user.mfa_otp_expires_at ||
        new Date() > user.mfa_otp_expires_at
      ) {
        throw new UnauthorizedException('OTP expired or not found');
      }
      isValid = user.mfa_otp_code === code;
    }

    if (!isValid) {
      await this.handleFailedAttempt(user, ip, userAgent);
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.userDal.update({
      identifierOptions: { id: userId },
      updatePayload: {
        mfa_failed_attempts: 0,
        mfa_locked_until: null,
        mfa_otp_code: null,
        mfa_otp_expires_at: null,
      },
      transactionOptions: { useTransaction: false },
    });

    await this.logMfaEvent(user, 'MFA_VERIFY_SUCCESS', ip, userAgent);

    return this.tokenService.generateTokens(user, true);
  }

  async verifyBackupCode(
    userId: string,
    code: string,
    ip: string,
    userAgent: string,
  ) {
    const user = await this.userDal.get({
      identifierOptions: { id: userId },
    });

    if (!user || !user.mfa_enabled) {
      throw new UnauthorizedException('MFA is not enabled');
    }

    this.checkLockout(user.mfa_locked_until);

    const backupCodes = user.mfa_backup_codes || [];
    let matchIndex = -1;

    for (let i = 0; i < backupCodes.length; i++) {
      if (backupCodes[i].used) continue;
      const isMatch = await bcrypt.compare(code, backupCodes[i].hash);
      if (isMatch) {
        matchIndex = i;
        break;
      }
    }

    if (matchIndex === -1) {
      await this.handleFailedAttempt(user, ip, userAgent);
      throw new UnauthorizedException('Invalid backup code');
    }

    backupCodes[matchIndex].used = true;

    await this.userDal.update({
      identifierOptions: { id: userId },
      updatePayload: {
        mfa_backup_codes: backupCodes,
        mfa_failed_attempts: 0,
        mfa_locked_until: null,
      },
      transactionOptions: { useTransaction: false },
    });

    await this.logMfaEvent(user, 'MFA_BACKUP_CODE_USED', ip, userAgent);

    return this.tokenService.generateTokens(user, true);
  }

  async disableMfa(
    userId: string,
    password: string,
    ip: string,
    userAgent: string,
  ) {
    const user = await this.userDal.get({
      identifierOptions: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfa_enabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    if (!user.password) {
      throw new BadRequestException(
        'Password required. Set a password before disabling MFA.',
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.userDal.update({
      identifierOptions: { id: userId },
      updatePayload: {
        mfa_enabled: false,
        mfa_type: MfaType.NONE,
        mfa_secret: null,
        mfa_otp_code: null,
        mfa_otp_expires_at: null,
        mfa_backup_codes: [],
        mfa_failed_attempts: 0,
        mfa_locked_until: null,
      },
      transactionOptions: { useTransaction: false },
    });

    await this.logMfaEvent(user, 'MFA_DISABLED', ip, userAgent);

    return { message: 'MFA disabled successfully' };
  }

  async regenerateBackupCodes(
    userId: string,
    password: string,
    ip: string,
    userAgent: string,
  ) {
    const user = await this.userDal.get({
      identifierOptions: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfa_enabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    if (!user.password) {
      throw new BadRequestException('Password required');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid password');
    }

    const { plaintext, hashed } = await this.generateBackupCodes();

    await this.userDal.update({
      identifierOptions: { id: userId },
      updatePayload: { mfa_backup_codes: hashed },
      transactionOptions: { useTransaction: false },
    });

    await this.logMfaEvent(
      user,
      'MFA_BACKUP_CODES_REGENERATED',
      ip,
      userAgent,
    );

    return { backupCodes: plaintext };
  }

  async getMfaStatus(userId: string) {
    const user = await this.userDal.get({
      identifierOptions: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const backupCodesRemaining = (user.mfa_backup_codes || []).filter(
      (c) => !c.used,
    ).length;

    return {
      mfa_enabled: user.mfa_enabled,
      mfa_type: user.mfa_type,
      backup_codes_remaining: backupCodesRemaining,
    };
  }

  private async generateBackupCodes() {
    const plaintext: string[] = [];
    const hashed: { hash: string; used: boolean }[] = [];

    for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
      const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const code = `${part1}-${part2}`;
      plaintext.push(code);
      const hash = await bcrypt.hash(code, BCRYPT_ROUNDS);
      hashed.push({ hash, used: false });
    }

    return { plaintext, hashed };
  }

  private checkLockout(mfaLockedUntil: Date | null) {
    if (mfaLockedUntil && new Date() < mfaLockedUntil) {
      throw new UnauthorizedException(
        'Account temporarily locked due to too many failed MFA attempts. Try again later.',
      );
    }
  }

  private async handleFailedAttempt(
    user: { id: string; org_id: string | null; role: string; mfa_failed_attempts: number },
    ip: string,
    userAgent: string,
  ) {
    const attempts = user.mfa_failed_attempts + 1;
    const updatePayload: Record<string, unknown> = {
      mfa_failed_attempts: attempts,
    };

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      updatePayload.mfa_locked_until = new Date(
        Date.now() + LOCKOUT_DURATION_MS,
      );

      await this.logMfaEvent(user, 'MFA_ACCOUNT_LOCKED', ip, userAgent);
    }

    await this.userDal.update({
      identifierOptions: { id: user.id },
      updatePayload,
      transactionOptions: { useTransaction: false },
    });

    await this.logMfaEvent(user, 'MFA_VERIFY_FAILED', ip, userAgent);
  }

  private async logMfaEvent(
    user: { id: string; org_id: string | null; role: string },
    action: string,
    ip: string,
    userAgent: string,
  ) {
    if (user.org_id) {
      await this.auditLogService.logAgencyAction({
        org_id: user.org_id,
        user_id: user.id,
        user_role: user.role,
        action,
        action_type: 'AUTH',
        ip_address: ip,
        user_agent: userAgent,
      });
    }
  }
}
