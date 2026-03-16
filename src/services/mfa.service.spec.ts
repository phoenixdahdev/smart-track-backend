import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { MfaType } from '@enums/mfa-type.enum';
import { AgencyRole } from '@enums/role.enum';
import { UserStatus } from '@enums/user-status.enum';

jest.mock('otplib', () => ({
  generateSecret: jest.fn().mockReturnValue('TESTSECRETBASE32'),
  generateURI: jest.fn().mockReturnValue('otpauth://totp/SmartTrack%20Health:test@test.com?secret=TESTSECRETBASE32'),
  verifySync: jest.fn().mockReturnValue({ valid: true, delta: 0 }),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqr'),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-backup-code'),
  compare: jest.fn().mockResolvedValue(false),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const otplib = require('otplib') as { verifySync: jest.Mock };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as { compare: jest.Mock };

describe('MfaService', () => {
  let service: MfaService;
  let userDal: { get: jest.Mock; update: jest.Mock };
  let tokenService: { generateTokens: jest.Mock };
  let encryptionService: { encrypt: jest.Mock; decrypt: jest.Mock };
  let emailService: { sendMfaOtp: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockUser = {
    id: 'user-uuid',
    email: 'test@test.com',
    name: 'Test User',
    password: 'hashed-password',
    role: AgencyRole.ADMIN,
    org_id: 'org-uuid',
    status: UserStatus.ACTIVE,
    mfa_enabled: false,
    mfa_type: MfaType.NONE,
    mfa_secret: null,
    mfa_otp_code: null,
    mfa_otp_expires_at: null,
    mfa_backup_codes: [],
    mfa_failed_attempts: 0,
    mfa_locked_until: null,
  };

  const mockTokens = { accessToken: 'at-xyz', refreshToken: 'rt-xyz' };

  beforeEach(() => {
    jest.clearAllMocks();

    userDal = {
      get: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
    };
    tokenService = {
      generateTokens: jest.fn().mockReturnValue(mockTokens),
    };
    encryptionService = {
      encrypt: jest.fn().mockReturnValue('encrypted-secret'),
      decrypt: jest.fn().mockReturnValue('TESTSECRETBASE32'),
    };
    emailService = {
      sendMfaOtp: jest.fn().mockResolvedValue(undefined),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new MfaService(
      userDal as never,
      tokenService as never,
      encryptionService as never,
      emailService as never,
      auditLogService as never,
    );
  });

  describe('setupTotp', () => {
    it('should generate secret, encrypt, and return QR data', async () => {
      const result = await service.setupTotp('user-uuid');

      expect(result.secret).toBe('TESTSECRETBASE32');
      expect(result.otpauthUri).toContain('otpauth://');
      expect(result.qrCodeDataUrl).toContain('data:image/png');
      expect(encryptionService.encrypt).toHaveBeenCalledWith('TESTSECRETBASE32');
      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: { mfa_secret: 'encrypted-secret' },
        }),
      );
    });

    it('should throw if user not found', async () => {
      userDal.get.mockResolvedValue(null);

      await expect(service.setupTotp('bad-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if MFA already enabled', async () => {
      userDal.get.mockResolvedValue({ ...mockUser, mfa_enabled: true });

      await expect(service.setupTotp('user-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('confirmTotpSetup', () => {
    it('should verify code, enable MFA, and return backup codes', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_secret: 'encrypted-secret',
      });
      otplib.verifySync.mockReturnValue({ valid: true, delta: 0 });

      const result = await service.confirmTotpSetup(
        'user-uuid',
        '123456',
        '127.0.0.1',
        'Agent',
      );

      expect(result.backupCodes).toHaveLength(10);
      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            mfa_enabled: true,
            mfa_type: MfaType.TOTP,
          }) as unknown,
        }),
      );
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MFA_TOTP_SETUP' }),
      );
    });

    it('should throw for invalid TOTP code', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_secret: 'encrypted-secret',
      });
      otplib.verifySync.mockReturnValue({ valid: false });

      await expect(
        service.confirmTotpSetup('user-uuid', '000000', '', ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if no mfa_secret', async () => {
      await expect(
        service.confirmTotpSetup('user-uuid', '123456', '', ''),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('setupEmailOtp', () => {
    it('should enable EMAIL_OTP and return backup codes', async () => {
      const result = await service.setupEmailOtp(
        'user-uuid',
        '127.0.0.1',
        'Agent',
      );

      expect(result.backupCodes).toHaveLength(10);
      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            mfa_enabled: true,
            mfa_type: MfaType.EMAIL_OTP,
          }) as unknown,
        }),
      );
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MFA_EMAIL_OTP_SETUP' }),
      );
    });

    it('should throw if MFA already enabled', async () => {
      userDal.get.mockResolvedValue({ ...mockUser, mfa_enabled: true });

      await expect(
        service.setupEmailOtp('user-uuid', '', ''),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendMfaEmailOtp', () => {
    it('should generate OTP and send email', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
        mfa_type: MfaType.EMAIL_OTP,
      });

      await service.sendMfaEmailOtp('user-uuid');

      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            mfa_otp_code: expect.any(String) as unknown,
          }) as unknown,
        }),
      );
      expect(emailService.sendMfaOtp).toHaveBeenCalled();
    });

    it('should do nothing if MFA not enabled', async () => {
      await service.sendMfaEmailOtp('user-uuid');

      expect(emailService.sendMfaOtp).not.toHaveBeenCalled();
    });
  });

  describe('verifyMfa', () => {
    it('should verify TOTP code and return tokens', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
        mfa_type: MfaType.TOTP,
        mfa_secret: 'encrypted-secret',
      });
      otplib.verifySync.mockReturnValue({ valid: true, delta: 0 });

      const result = await service.verifyMfa(
        'user-uuid',
        '123456',
        '127.0.0.1',
        'Agent',
      );

      expect(result).toEqual(mockTokens);
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MFA_VERIFY_SUCCESS' }),
      );
    });

    it('should verify Email OTP and return tokens', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
        mfa_type: MfaType.EMAIL_OTP,
        mfa_otp_code: '654321',
        mfa_otp_expires_at: new Date(Date.now() + 300000),
      });

      const result = await service.verifyMfa(
        'user-uuid',
        '654321',
        '127.0.0.1',
        'Agent',
      );

      expect(result).toEqual(mockTokens);
    });

    it('should throw for expired email OTP', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
        mfa_type: MfaType.EMAIL_OTP,
        mfa_otp_code: '654321',
        mfa_otp_expires_at: new Date(Date.now() - 1000),
      });

      await expect(
        service.verifyMfa('user-uuid', '654321', '', ''),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should increment failed attempts on invalid code', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
        mfa_type: MfaType.TOTP,
        mfa_secret: 'encrypted-secret',
      });
      otplib.verifySync.mockReturnValue({ valid: false });

      await expect(
        service.verifyMfa('user-uuid', '000000', '', ''),
      ).rejects.toThrow(UnauthorizedException);

      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            mfa_failed_attempts: 1,
          }) as unknown,
        }),
      );
    });

    it('should lock account after 5 failed attempts', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
        mfa_type: MfaType.TOTP,
        mfa_secret: 'encrypted-secret',
        mfa_failed_attempts: 4,
      });
      otplib.verifySync.mockReturnValue({ valid: false });

      await expect(
        service.verifyMfa('user-uuid', '000000', '', ''),
      ).rejects.toThrow(UnauthorizedException);

      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            mfa_failed_attempts: 5,
            mfa_locked_until: expect.any(Date) as unknown,
          }) as unknown,
        }),
      );
    });

    it('should reject locked accounts', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
        mfa_type: MfaType.TOTP,
        mfa_locked_until: new Date(Date.now() + 900000),
      });

      await expect(
        service.verifyMfa('user-uuid', '123456', '', ''),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify valid backup code and return tokens', async () => {
      bcrypt.compare.mockResolvedValueOnce(true);

      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
        mfa_backup_codes: [
          { hash: 'hashed-code', used: false },
        ],
      });

      const result = await service.verifyBackupCode(
        'user-uuid',
        'ABCD-1234',
        '127.0.0.1',
        'Agent',
      );

      expect(result).toEqual(mockTokens);
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MFA_BACKUP_CODE_USED' }),
      );
    });

    it('should reject already used backup code', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
        mfa_backup_codes: [
          { hash: 'hashed-code', used: true },
        ],
      });

      await expect(
        service.verifyBackupCode('user-uuid', 'ABCD-1234', '', ''),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject invalid backup code', async () => {
      bcrypt.compare.mockResolvedValue(false);

      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
        mfa_backup_codes: [
          { hash: 'hashed-code', used: false },
        ],
      });

      await expect(
        service.verifyBackupCode('user-uuid', 'WRONG-CODE', '', ''),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('disableMfa', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should disable MFA with valid password', async () => {
      bcrypt.compare.mockResolvedValueOnce(true);
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
        mfa_type: MfaType.TOTP,
      });

      const result = await service.disableMfa(
        'user-uuid',
        'password123',
        '127.0.0.1',
        'Agent',
      );

      expect(result.message).toBe('MFA disabled successfully');
      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            mfa_enabled: false,
            mfa_type: MfaType.NONE,
            mfa_secret: null,
          }) as unknown,
        }),
      );
    });

    it('should throw for invalid password', async () => {
      bcrypt.compare.mockResolvedValueOnce(false);
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
      });

      await expect(
        service.disableMfa('user-uuid', 'wrongpass', '', ''),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if MFA not enabled', async () => {
      await expect(
        service.disableMfa('user-uuid', 'pass', '', ''),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('regenerateBackupCodes', () => {
    it('should regenerate codes with valid password', async () => {
      bcrypt.compare.mockResolvedValueOnce(true);
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
      });

      const result = await service.regenerateBackupCodes(
        'user-uuid',
        'password123',
        '127.0.0.1',
        'Agent',
      );

      expect(result.backupCodes).toHaveLength(10);
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MFA_BACKUP_CODES_REGENERATED' }),
      );
    });
  });

  describe('getMfaStatus', () => {
    it('should return MFA status', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        mfa_enabled: true,
        mfa_type: MfaType.TOTP,
        mfa_backup_codes: [
          { hash: 'h1', used: false },
          { hash: 'h2', used: true },
          { hash: 'h3', used: false },
        ],
      });

      const result = await service.getMfaStatus('user-uuid');

      expect(result.mfa_enabled).toBe(true);
      expect(result.mfa_type).toBe(MfaType.TOTP);
      expect(result.backup_codes_remaining).toBe(2);
    });
  });
});
