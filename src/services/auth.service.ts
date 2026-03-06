import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { UserDal } from '@dals/user.dal';
import { UserStatus } from '@enums/user-status.enum';
import { AuditLogService } from './audit-log.service';
import { EmailService } from './email.service';
import { type SignupDto } from '@dtos/signup.dto';
import { type SigninDto } from '@dtos/signin.dto';
import { type GoogleSigninDto } from '@dtos/google-signin.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;
  private readonly jwtRefreshSecret: string;
  private readonly jwtRefreshExpiration: string;

  constructor(
    private readonly userDal: UserDal,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
    private readonly emailService: EmailService,
  ) {
    this.googleClient = new OAuth2Client(
      configService.get<string>('GOOGLE_CLIENT_ID'),
    );
    this.jwtRefreshSecret = configService.get<string>(
      'JWT_REFRESH_SECRET',
      'change-me-refresh',
    );
    this.jwtRefreshExpiration = configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );
  }

  async signup(dto: SignupDto, ip: string, userAgent: string) {
    const existing = await this.userDal.get({
      identifierOptions: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const otp = this.generateOtp();

    const user = await this.userDal.create({
      createPayload: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        email_verified: false,
        otp_code: otp,
        otp_expires_at: new Date(Date.now() + 10 * 60 * 1000),
      },
      transactionOptions: { useTransaction: false },
    });

    const tokens = this.generateTokens(user);

    await this.emailService.sendOtp(user.email, user.name, otp);

    if (user.org_id) {
      await this.auditLogService.logAgencyAction({
        org_id: user.org_id,
        user_id: user.id,
        user_role: user.role,
        action: 'SIGNUP',
        action_type: 'AUTH',
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    return { user, ...tokens };
  }

  async verifyEmail(email: string, otp: string) {
    const user = await this.userDal.get({
      identifierOptions: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid email or OTP');
    }

    if (user.email_verified) {
      throw new BadRequestException('Email already verified');
    }

    if (!user.otp_code || !user.otp_expires_at) {
      throw new BadRequestException('No pending verification');
    }

    if (new Date() > user.otp_expires_at) {
      throw new BadRequestException('OTP has expired');
    }

    if (user.otp_code !== otp) {
      throw new BadRequestException('Invalid email or OTP');
    }

    await this.userDal.update({
      identifierOptions: { id: user.id },
      updatePayload: {
        email_verified: true,
        otp_code: null,
        otp_expires_at: null,
      },
      transactionOptions: { useTransaction: false },
    });

    return { message: 'Email verified successfully' };
  }

  async resendOtp(email: string) {
    const user = await this.userDal.get({
      identifierOptions: { email },
    });

    if (!user) {
      return { message: 'If the email exists, a new OTP has been sent' };
    }

    if (user.email_verified) {
      return { message: 'If the email exists, a new OTP has been sent' };
    }

    const otp = this.generateOtp();

    await this.userDal.update({
      identifierOptions: { id: user.id },
      updatePayload: {
        otp_code: otp,
        otp_expires_at: new Date(Date.now() + 10 * 60 * 1000),
      },
      transactionOptions: { useTransaction: false },
    });

    await this.emailService.sendOtp(user.email, user.name, otp);

    return { message: 'If the email exists, a new OTP has been sent' };
  }

  async signin(dto: SigninDto, ip: string, userAgent: string) {
    const user = await this.userDal.get({
      identifierOptions: { email: dto.email },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    await this.userDal.update({
      identifierOptions: { id: user.id },
      updatePayload: { last_login: new Date() },
      transactionOptions: { useTransaction: false },
    });

    const tokens = this.generateTokens(user);

    if (user.org_id) {
      await this.auditLogService.logAgencyAction({
        org_id: user.org_id,
        user_id: user.id,
        user_role: user.role,
        action: 'LOGIN',
        action_type: 'AUTH',
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    return { user, ...tokens };
  }

  async googleSignin(dto: GoogleSigninDto, ip: string, userAgent: string) {
    const ticket = await this.googleClient
      .verifyIdToken({
        idToken: dto.idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      })
      .catch(() => {
        throw new UnauthorizedException('Invalid Google ID token');
      });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    const user = await this.userDal.get({
      identifierOptions: { email: payload.email },
    });

    if (!user) {
      throw new UnauthorizedException('No account found for this email');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    await this.userDal.update({
      identifierOptions: { id: user.id },
      updatePayload: { last_login: new Date() },
      transactionOptions: { useTransaction: false },
    });

    const tokens = this.generateTokens(user);

    if (user.org_id) {
      await this.auditLogService.logAgencyAction({
        org_id: user.org_id,
        user_id: user.id,
        user_role: user.role,
        action: 'GOOGLE_LOGIN',
        action_type: 'AUTH',
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    return { user, ...tokens };
  }

  async getMe(userId: string) {
    const user = await this.userDal.get({
      identifierOptions: { id: userId },
      relations: { organization: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      org_id: user.org_id,
      sub_permissions: user.sub_permissions as Record<string, boolean>,
      session_timeout: user.session_timeout,
      mfa_enabled: user.mfa_enabled,
      email_verified: user.email_verified,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userDal.get({
      identifierOptions: { email },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      await this.userDal.update({
        identifierOptions: { id: user.id },
        updatePayload: {
          reset_token: hashedToken,
          reset_token_expires_at: new Date(Date.now() + 60 * 60 * 1000),
        },
        transactionOptions: { useTransaction: false },
      });

      await this.emailService.sendPasswordReset(
        user.email,
        user.name,
        resetToken,
      );
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userDal.get({
      identifierOptions: { reset_token: hashedToken },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (
      !user.reset_token_expires_at ||
      new Date() > user.reset_token_expires_at
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.userDal.update({
      identifierOptions: { id: user.id },
      updatePayload: {
        password: hashedPassword,
        reset_token: null,
        reset_token_expires_at: null,
      },
      transactionOptions: { useTransaction: false },
    });

    return { message: 'Password reset successfully' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: this.jwtRefreshSecret,
      });

      const user = await this.userDal.get({
        identifierOptions: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async signout(
    userId: string,
    orgId: string | null,
    role: string,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    if (orgId) {
      await this.auditLogService.logAgencyAction({
        org_id: orgId,
        user_id: userId,
        user_role: role,
        action: 'LOGOUT',
        action_type: 'AUTH',
        ip_address: ip,
        user_agent: userAgent,
      });
    }
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private generateTokens(user: {
    id: string;
    email: string;
    role: string;
    org_id: string | null;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      org_id: user.org_id,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtRefreshSecret,
      expiresIn: this.jwtRefreshExpiration as unknown as number,
    });

    return { accessToken, refreshToken };
  }
}
