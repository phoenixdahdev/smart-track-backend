import { MfaController } from './mfa.controller';
import { MfaService } from '@services/mfa.service';
import { AgencyRole } from '@enums/role.enum';
import { MfaType } from '@enums/mfa-type.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { type Request } from 'express';

describe('MfaController', () => {
  let controller: MfaController;
  let mfaService: {
    getMfaStatus: jest.Mock;
    setupTotp: jest.Mock;
    confirmTotpSetup: jest.Mock;
    setupEmailOtp: jest.Mock;
    verifyMfa: jest.Mock;
    verifyBackupCode: jest.Mock;
    sendMfaEmailOtp: jest.Mock;
    disableMfa: jest.Mock;
    regenerateBackupCodes: jest.Mock;
  };

  const mockUser: AuthenticatedUser = {
    id: 'user-uuid',
    email: 'test@agency.com',
    name: 'Test User',
    role: AgencyRole.ADMIN,
    org_id: 'org-uuid',
    sub_permissions: {},
    session_timeout: 30,
    mfa_enabled: false,
    mfa_type: MfaType.NONE,
    mfa_verified: true,
    email_verified: true,
  };

  const mockReq = {
    headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'TestAgent' },
    ip: '127.0.0.1',
  } as unknown as Request;

  beforeEach(() => {
    mfaService = {
      getMfaStatus: jest.fn().mockResolvedValue({
        mfa_enabled: false,
        mfa_type: MfaType.NONE,
        backup_codes_remaining: 0,
      }),
      setupTotp: jest.fn().mockResolvedValue({
        secret: 'secret',
        otpauthUri: 'otpauth://totp/...',
        qrCodeDataUrl: 'data:image/png;base64,...',
      }),
      confirmTotpSetup: jest
        .fn()
        .mockResolvedValue({ backupCodes: ['CODE-0001'] }),
      setupEmailOtp: jest
        .fn()
        .mockResolvedValue({ backupCodes: ['CODE-0001'] }),
      verifyMfa: jest.fn().mockResolvedValue({
        accessToken: 'at-xyz',
        refreshToken: 'rt-xyz',
      }),
      verifyBackupCode: jest.fn().mockResolvedValue({
        accessToken: 'at-xyz',
        refreshToken: 'rt-xyz',
      }),
      sendMfaEmailOtp: jest.fn().mockResolvedValue(undefined),
      disableMfa: jest
        .fn()
        .mockResolvedValue({ message: 'MFA disabled successfully' }),
      regenerateBackupCodes: jest
        .fn()
        .mockResolvedValue({ backupCodes: ['CODE-0002'] }),
    };

    controller = new MfaController(mfaService as unknown as MfaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /auth/mfa/status', () => {
    it('should return MFA status', async () => {
      const result = await controller.getStatus('user-uuid');

      expect(result.message).toBe('MFA status retrieved');
      expect(mfaService.getMfaStatus).toHaveBeenCalledWith('user-uuid');
    });
  });

  describe('POST /auth/mfa/totp/setup', () => {
    it('should return TOTP setup data', async () => {
      const result = await controller.setupTotp('user-uuid');

      expect(result.message).toContain('TOTP setup initiated');
      expect(result.data.qrCodeDataUrl).toBeDefined();
      expect(mfaService.setupTotp).toHaveBeenCalledWith('user-uuid');
    });
  });

  describe('POST /auth/mfa/totp/confirm', () => {
    it('should confirm TOTP and return backup codes', async () => {
      const result = await controller.confirmTotp(
        mockUser,
        { code: '123456' },
        mockReq,
      );

      expect(result.message).toContain('TOTP MFA enabled');
      expect(result.data.backupCodes).toBeDefined();
      expect(mfaService.confirmTotpSetup).toHaveBeenCalledWith(
        'user-uuid',
        '123456',
        '10.0.0.1',
        'TestAgent',
      );
    });
  });

  describe('POST /auth/mfa/email-otp/setup', () => {
    it('should enable Email OTP MFA', async () => {
      const result = await controller.setupEmailOtp(mockUser, mockReq);

      expect(result.message).toContain('Email OTP MFA enabled');
      expect(mfaService.setupEmailOtp).toHaveBeenCalledWith(
        'user-uuid',
        '10.0.0.1',
        'TestAgent',
      );
    });
  });

  describe('POST /auth/mfa/verify', () => {
    it('should verify MFA code and return tokens', async () => {
      const result = await controller.verify(
        mockUser,
        { code: '123456' },
        mockReq,
      );

      expect(result.message).toBe('MFA verified successfully');
      expect(result.data.accessToken).toBe('at-xyz');
    });
  });

  describe('POST /auth/mfa/verify/backup', () => {
    it('should verify backup code and return tokens', async () => {
      const result = await controller.verifyBackup(
        mockUser,
        { code: 'ABCD-1234' },
        mockReq,
      );

      expect(result.message).toBe('Backup code verified successfully');
      expect(result.data.accessToken).toBe('at-xyz');
    });
  });

  describe('POST /auth/mfa/resend', () => {
    it('should resend MFA OTP', async () => {
      const result = await controller.resendMfaOtp('user-uuid');

      expect(result.message).toBe('MFA verification code resent');
      expect(mfaService.sendMfaEmailOtp).toHaveBeenCalledWith('user-uuid');
    });
  });

  describe('POST /auth/mfa/disable', () => {
    it('should disable MFA', async () => {
      const result = await controller.disable(
        mockUser,
        { password: 'password123' },
        mockReq,
      );

      expect(result.message).toBe('MFA disabled successfully');
    });
  });

  describe('POST /auth/mfa/backup-codes/regenerate', () => {
    it('should regenerate backup codes', async () => {
      const result = await controller.regenerateBackupCodes(
        mockUser,
        { password: 'password123' },
        mockReq,
      );

      expect(result.message).toContain('Backup codes regenerated');
      expect(result.data.backupCodes).toBeDefined();
    });
  });
});
