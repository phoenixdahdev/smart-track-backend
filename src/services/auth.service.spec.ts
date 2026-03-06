import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuditLogService } from './audit-log.service';
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
        picture: 'https://photo.url',
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
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should create user and return tokens', async () => {
      userDal.get.mockResolvedValue(null);

      const result = await service.signup(
        { name: 'New User', email: 'new@agency.com', password: 'password123', org_id: 'org-uuid' },
        '127.0.0.1',
        'Agent',
      );

      expect(userDal.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should throw BadRequestException for existing email', async () => {
      await expect(
        service.signup(
          { name: 'Dupe', email: 'test@agency.com', password: 'password123', org_id: 'org-uuid' },
          '127.0.0.1',
          '',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log audit event on signup', async () => {
      userDal.get.mockResolvedValue(null);

      await service.signup(
        { name: 'New', email: 'new@agency.com', password: 'pass1234', org_id: 'org-uuid' },
        '127.0.0.1',
        'Agent',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SIGNUP',
          user_id: 'user-uuid',
        }),
      );
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
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userDal.get.mockResolvedValue(null);

      await expect(
        service.signin(
          { email: 'bad@agency.com', password: 'wrong' },
          '127.0.0.1',
          '',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      bcrypt.compare.mockResolvedValueOnce(false);

      await expect(
        service.signin(
          { email: 'test@agency.com', password: 'wrong' },
          '127.0.0.1',
          '',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for suspended user', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      });

      await expect(
        service.signin(
          { email: 'test@agency.com', password: 'password123' },
          '127.0.0.1',
          '',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update last_login on signin', async () => {
      await service.signin(
        { email: 'test@agency.com', password: 'password123' },
        '127.0.0.1',
        '',
      );

      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: 'user-uuid' },
          updatePayload: { last_login: expect.any(Date) as unknown },
        }),
      );
    });

    it('should log audit event on signin', async () => {
      await service.signin(
        { email: 'test@agency.com', password: 'password123' },
        '127.0.0.1',
        'Agent',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN',
          user_id: 'user-uuid',
          ip_address: '127.0.0.1',
        }),
      );
    });

    it('should throw for user without password (OAuth-only)', async () => {
      userDal.get.mockResolvedValue({ ...mockUser, password: null });

      await expect(
        service.signin(
          { email: 'test@agency.com', password: 'password123' },
          '127.0.0.1',
          '',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('googleSignin', () => {
    it('should return user and tokens for valid Google ID token', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        email: 'google@agency.com',
      });

      const result = await service.googleSignin(
        { idToken: 'valid-google-token' },
        '127.0.0.1',
        'Agent',
      );

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should throw when user not found by Google email', async () => {
      userDal.get.mockResolvedValue(null);

      await expect(
        service.googleSignin(
          { idToken: 'valid-google-token' },
          '127.0.0.1',
          '',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for inactive user on Google signin', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        email: 'google@agency.com',
        status: UserStatus.SUSPENDED,
      });

      await expect(
        service.googleSignin(
          { idToken: 'valid-google-token' },
          '127.0.0.1',
          '',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should log audit event on Google signin', async () => {
      userDal.get.mockResolvedValue({
        ...mockUser,
        email: 'google@agency.com',
      });

      await service.googleSignin(
        { idToken: 'valid-google-token' },
        '127.0.0.1',
        'Agent',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'GOOGLE_LOGIN',
        }),
      );
    });
  });

  describe('getSession', () => {
    it('should return session data for active user', async () => {
      const result = await service.getSession('user-uuid');

      expect(result.id).toBe('user-uuid');
      expect(result.email).toBe('test@agency.com');
    });

    it('should include organization relation', async () => {
      await service.getSession('user-uuid');

      expect(userDal.get).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: { organization: true },
        }),
      );
    });

    it('should throw UnauthorizedException for missing user', async () => {
      userDal.get.mockResolvedValue(null);

      await expect(service.getSession('bad-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-uuid' });

      const result = await service.refreshToken('old-token');

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should verify with refresh secret', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-uuid' });

      await service.refreshToken('old-token');

      expect(jwtService.verify).toHaveBeenCalledWith('old-token', {
        secret: 'test-refresh-secret',
      });
    });

    it('should throw on invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refreshToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw for inactive user on refresh', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-uuid' });
      userDal.get.mockResolvedValue({
        ...mockUser,
        status: UserStatus.ARCHIVED,
      });

      await expect(service.refreshToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('signout', () => {
    it('should log audit event on signout', async () => {
      await service.signout(
        'user-uuid',
        'org-uuid',
        'ADMIN',
        '127.0.0.1',
        'Agent',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGOUT',
          user_id: 'user-uuid',
          org_id: 'org-uuid',
        }),
      );
    });
  });
});
