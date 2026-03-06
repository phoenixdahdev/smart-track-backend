import { AuthController } from './auth.controller';
import { AuthService } from '@services/auth.service';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { type Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    signup: jest.Mock;
    signin: jest.Mock;
    googleSignin: jest.Mock;
    getSession: jest.Mock;
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
  };

  const mockTokens = { accessToken: 'at-xyz', refreshToken: 'rt-xyz' };

  const mockReq = {
    headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'TestAgent' },
    ip: '127.0.0.1',
  } as unknown as Request;

  beforeEach(() => {
    authService = {
      signup: jest.fn().mockResolvedValue({ user: mockUser, ...mockTokens }),
      signin: jest.fn().mockResolvedValue({ user: mockUser, ...mockTokens }),
      googleSignin: jest
        .fn()
        .mockResolvedValue({ user: mockUser, ...mockTokens }),
      getSession: jest.fn().mockResolvedValue(mockUser),
      refreshToken: jest.fn().mockResolvedValue(mockTokens),
      signout: jest.fn().mockResolvedValue(undefined),
    };

    controller = new AuthController(authService as unknown as AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/signup', () => {
    it('should return created user and tokens', async () => {
      const result = await controller.signup(
        {
          name: 'New User',
          email: 'new@agency.com',
          password: 'password123',
          org_id: 'org-uuid',
        },
        mockReq,
      );

      expect(result.message).toBe('Account created successfully');
      expect(result.data).toEqual({ user: mockUser, ...mockTokens });
    });

    it('should pass IP and user agent to service', async () => {
      await controller.signup(
        {
          name: 'New',
          email: 'new@agency.com',
          password: 'password123',
          org_id: 'org-uuid',
        },
        mockReq,
      );

      expect(authService.signup).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@agency.com' }),
        '10.0.0.1',
        'TestAgent',
      );
    });
  });

  describe('POST /auth/signin', () => {
    it('should return user and tokens', async () => {
      const result = await controller.signin(
        { email: 'test@agency.com', password: 'password123' },
        mockReq,
      );

      expect(result.message).toBe('Signed in successfully');
      expect(result.data.accessToken).toBe('at-xyz');
    });
  });

  describe('POST /auth/signin/google', () => {
    it('should return user and tokens for Google signin', async () => {
      const result = await controller.googleSignin(
        { idToken: 'google-id-token' },
        mockReq,
      );

      expect(result.message).toBe('Signed in with Google successfully');
      expect(result.data.accessToken).toBe('at-xyz');
    });
  });

  describe('GET /auth/session', () => {
    it('should return current session', async () => {
      const result = await controller.session('user-uuid');

      expect(result.message).toBe('Session retrieved');
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('POST /auth/signout', () => {
    it('should call signout and return success', async () => {
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

      expect(result.message).toBe('Tokens refreshed');
      expect(result.data).toEqual(mockTokens);
    });
  });
});
