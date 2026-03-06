import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuditLogService } from './audit-log.service';
import { EmailService } from './email.service';
import { AgencyRole } from '@enums/role.enum';
import { UserStatus } from '@enums/user-status.enum';
import { MfaType } from '@enums/mfa-type.enum';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({
        email: 'google@agency.com',
        name: 'Google User',
      }),
    }),
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as { compare: jest.Mock };

describe('AuthService', () => {
  let service: AuthService;
  let userDal: { get: jest.Mock; create: jest.Mock; update: jest.Mock };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };
  let emailService: { sendOtp: jest.Mock; sendPasswordReset: jest.Mock };

  const mockUser = {
    id: 'user-uuid',
    email: 'test@agency.com',
    name: 'Test User',
    password: 'hashed-password',
    role: AgencyRole.ADMIN,
    org_id: 'org-uuid',
    sub_permissions: { 'view:reports': true },
    session_timeout: 30,
    mfa_enabled: false,
    mfa_type: MfaType.NONE,
    status: UserStatus.ACTIVE,
    email_verified: true,
    otp_code: null,
    otp_expires_at: null,
    reset_token: null,
    reset_token_expires_at: null,
    last_login: null,
  };

  beforeEach(() => {
    userDal = {
      get: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };
    emailService = {
      sendOtp: jest.fn().mockResolvedValue(undefined),
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    };

    const configService = {
      get: jest.fn().mockImplementation((key: string, defaultVal?: string) => {
        const config: Record<string, string> = {
          GOOGLE_CLIENT_ID: 'test-google-id',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return config[key] ?? defaultVal ?? '';
      }),
    } as unknown as ConfigService;

    service = new AuthService(
      userDal as never,
      jwtService as unknown as JwtService,
      configService,
      auditLogService as unknown as AuditLogService,
      emailService as unknown as EmailService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should create user, send OTP, and return tokens', async () => {
      userDal.get.mockResolvedValue(null);

      const result = await service.signup(
        { name: 'New User', email: 'new@agency.com', password: 'password123' },
        '127.0.0.1',
        'Agent',
      );

      expect(userDal.create).toHaveBeenCalled();
      expect(emailService.sendOtp).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw BadRequestException for existing email', async () => {
      await expect(
        service.signup(
          { name: 'Dupe', email: 'test@agency.com', password: 'password123' },
          '127.0.0.1',
          '',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with correct OTP', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        email_verified: false,
        otp_code: '123456',
        otp_expires_at: new Date(Date.now() + 600000),
      });

      const result = await service.verifyEmail('test@agency.com', '123456');

      expect(result.message).toBe('Email verified successfully');
      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({ email_verified: true }),
        }),
      );
    });

    it('should throw for wrong OTP', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        email_verified: false,
        otp_code: '123456',
        otp_expires_at: new Date(Date.now() + 600000),
      });

      await expect(
        service.verifyEmail('test@agency.com', '000000'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for expired OTP', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        email_verified: false,
        otp_code: '123456',
        otp_expires_at: new Date(Date.now() - 1000),
      });

      await expect(
        service.verifyEmail('test@agency.com', '123456'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for already verified email', async () => {
      await expect(
        service.verifyEmail('test@agency.com', '123456'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendOtp', () => {
    it('should generate new OTP and send email', async () => {
      userDal.get.mockResolvedValue({ ...mockUser, email_verified: false });

      const result = await service.resendOtp('test@agency.com');

      expect(emailService.sendOtp).toHaveBeenCalled();
      expect(result.message).toContain('OTP has been sent');
    });

    it('should return generic message for non-existent email', async () => {
      userDal.get.mockResolvedValue(null);

      const result = await service.resendOtp('nonexistent@agency.com');

      expect(result.message).toContain('OTP has been sent');
      expect(emailService.sendOtp).not.toHaveBeenCalled();
    });
  });

  describe('signin', () => {
    it('should return user and tokens for valid credentials', async () => {
      const result = await service.signin(
        { email: 'test@agency.com', password: 'password123' },
        '127.0.0.1',
        'Agent',
      );

      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw for non-existent user', async () => {
      userDal.get.mockResolvedValue(null);

      await expect(
        service.signin({ email: 'bad@agency.com', password: 'wrong' }, '', ''),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for invalid password', async () => {
      bcrypt.compare.mockResolvedValueOnce(false);

      await expect(
        service.signin({ email: 'test@agency.com', password: 'wrong' }, '', ''),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for suspended user', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      });

      await expect(
        service.signin({ email: 'test@agency.com', password: 'pass' }, '', ''),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for user without password', async () => {
      userDal.get.mockResolvedValue({ ...mockUser, password: null });

      await expect(
        service.signin({ email: 'test@agency.com', password: 'pass' }, '', ''),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('googleSignin', () => {
    it('should return tokens for valid Google token', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        email: 'google@agency.com',
      });

      const result = await service.googleSignin(
        { idToken: 'valid-token' },
        '127.0.0.1',
        'Agent',
      );

      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw when user not found', async () => {
      userDal.get.mockResolvedValue(null);

      await expect(
        service.googleSignin({ idToken: 'valid' }, '', ''),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      const result = await service.getMe('user-uuid');

      expect(result.id).toBe('user-uuid');
      expect(result.email_verified).toBe(true);
    });

    it('should throw for missing user', async () => {
      userDal.get.mockResolvedValue(null);

      await expect(service.getMe('bad-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email for existing user', async () => {
      const result = await service.forgotPassword('test@agency.com');

      expect(emailService.sendPasswordReset).toHaveBeenCalled();
      expect(result.message).toContain('reset link has been sent');
    });

    it('should return generic message for non-existent email', async () => {
      userDal.get.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@test.com');

      expect(result.message).toContain('reset link has been sent');
      expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        reset_token: 'hashed-token',
        reset_token_expires_at: new Date(Date.now() + 3600000),
      });

      const result = await service.resetPassword('raw-token', 'newpass123');

      expect(result.message).toBe('Password reset successfully');
      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            reset_token: null,
            reset_token_expires_at: null,
          }),
        }),
      );
    });

    it('should throw for invalid token', async () => {
      userDal.get.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad-token', 'newpass123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for expired token', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        reset_token: 'hashed',
        reset_token_expires_at: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword('raw', 'newpass123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-uuid' });

      const result = await service.refreshToken('old-token');

      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw on invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refreshToken('bad')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('signout', () => {
    it('should log audit event when org_id present', async () => {
      await service.signout('user-uuid', 'org-uuid', 'ADMIN', '127.0.0.1', 'Agent');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGOUT' }),
      );
    });

    it('should skip audit log when no org_id', async () => {
      await service.signout('user-uuid', null, 'DSP', '127.0.0.1', 'Agent');

      expect(auditLogService.logAgencyAction).not.toHaveBeenCalled();
    });
  });
});
