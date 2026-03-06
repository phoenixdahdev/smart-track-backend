import { AuthController } from './auth.controller';
import { AuthService } from '@services/auth.service';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { type Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    signup: jest.Mock;
    verifyEmail: jest.Mock;
    resendOtp: jest.Mock;
    signin: jest.Mock;
    googleSignin: jest.Mock;
    getMe: jest.Mock;
    forgotPassword: jest.Mock;
    resetPassword: jest.Mock;
    refreshToken: jest.Mock;
    signout: jest.Mock;
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
    email_verified: true,
  };

  const mockTokens = { accessToken: 'at-xyz', refreshToken: 'rt-xyz' };

  const mockReq = {
    headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'TestAgent' },
    ip: '127.0.0.1',
  } as unknown as Request;

  beforeEach(() => {
    authService = {
      signup: jest.fn().mockResolvedValue({ user: mockUser, ...mockTokens }),
      verifyEmail: jest.fn().mockResolvedValue({ message: 'Email verified successfully' }),
      resendOtp: jest.fn().mockResolvedValue({ message: 'OTP sent' }),
      signin: jest.fn().mockResolvedValue({ user: mockUser, ...mockTokens }),
      googleSignin: jest.fn().mockResolvedValue({ user: mockUser, ...mockTokens }),
      getMe: jest.fn().mockResolvedValue(mockUser),
      forgotPassword: jest.fn().mockResolvedValue({ message: 'Reset link sent' }),
      resetPassword: jest.fn().mockResolvedValue({ message: 'Password reset' }),
      refreshToken: jest.fn().mockResolvedValue(mockTokens),
      signout: jest.fn().mockResolvedValue(undefined),
    };

    controller = new AuthController(authService as unknown as AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/signup', () => {
    it('should return user and tokens', async () => {
      const result = await controller.signup(
        { name: 'New', email: 'new@test.com', password: 'pass1234' },
        mockReq,
      );

      expect(result.message).toContain('Account created');
      expect(result.data.accessToken).toBe('at-xyz');
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should verify email', async () => {
      const result = await controller.verifyEmail({
        email: 'test@test.com',
        otp: '123456',
      });

      expect(result.message).toBe('Email verified successfully');
    });
  });

  describe('POST /auth/resend-otp', () => {
    it('should resend OTP', async () => {
      const result = await controller.resendOtp({ email: 'test@test.com' });

      expect(result.message).toBe('OTP sent');
    });
  });

  describe('POST /auth/signin', () => {
    it('should return user and tokens', async () => {
      const result = await controller.signin(
        { email: 'test@test.com', password: 'pass' },
        mockReq,
      );

      expect(result.message).toBe('Signed in successfully');
    });
  });

  describe('POST /auth/signin/google', () => {
    it('should return user and tokens', async () => {
      const result = await controller.googleSignin(
        { idToken: 'token' },
        mockReq,
      );

      expect(result.message).toBe('Signed in with Google successfully');
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user', async () => {
      const result = await controller.me('user-uuid');

      expect(result.message).toBe('User retrieved');
      expect(result.data.id).toBe('user-uuid');
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should return success message', async () => {
      const result = await controller.forgotPassword({ email: 'test@test.com' });

      expect(result.message).toBe('Reset link sent');
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password', async () => {
      const result = await controller.resetPassword({
        token: 'reset-token',
        newPassword: 'newpass123',
      });

      expect(result.message).toBe('Password reset');
    });
  });

  describe('POST /auth/signout', () => {
    it('should sign out', async () => {
      const result = await controller.signout(mockUser, mockReq);

      expect(result.message).toBe('Signed out successfully');
      expect(authService.signout).toHaveBeenCalledWith(
        'user-uuid',
        'org-uuid',
        AgencyRole.ADMIN,
        '10.0.0.1',
        'TestAgent',
      );
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return new tokens', async () => {
      const result = await controller.refresh('old-rt');

      expect(result.data).toEqual(mockTokens);
    });
  });
});
