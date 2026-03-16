import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: { sign: jest.Mock; verify: jest.Mock };

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn().mockReturnValue({ sub: 'user-uuid' }),
    };

    const configService = {
      get: jest.fn().mockImplementation((key: string, defaultVal: string) => {
        const config: Record<string, string> = {
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return config[key] ?? defaultVal;
      }),
    } as unknown as ConfigService;

    service = new TokenService(
      jwtService as unknown as JwtService,
      configService,
    );
  });

  const mockUser = {
    id: 'user-uuid',
    email: 'test@test.com',
    role: 'ADMIN',
    org_id: 'org-uuid',
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens with mfa_verified: true', () => {
      const result = service.generateTokens(mockUser, true);

      expect(result).toEqual({
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ mfa_verified: true }),
      );
    });

    it('should generate tokens with mfa_verified: false', () => {
      service.generateTokens(mockUser, false);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ mfa_verified: false }),
      );
    });

    it('should use refresh secret for refresh token', () => {
      service.generateTokens(mockUser, true);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ sub: 'user-uuid' }),
        expect.objectContaining({ secret: 'test-refresh-secret' }),
      );
    });
  });

  describe('generateMfaPendingToken', () => {
    it('should generate token with mfa_verified: false and 5m expiry', () => {
      const result = service.generateMfaPendingToken(mockUser);

      expect(result).toBe('mock-token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ mfa_verified: false }),
        expect.objectContaining({ expiresIn: '5m' }),
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify token with refresh secret', () => {
      const result = service.verifyRefreshToken('some-token');

      expect(result).toEqual({ sub: 'user-uuid' });
      expect(jwtService.verify).toHaveBeenCalledWith('some-token', {
        secret: 'test-refresh-secret',
      });
    });
  });
});
