import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AgencyRole } from '@enums/role.enum';
import { UserStatus } from '@enums/user-status.enum';
import { MfaType } from '@enums/mfa-type.enum';
import { type JwtPayload } from '@app-types/auth.types';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userDal: { get: jest.Mock };

  const mockUser = {
    id: 'user-uuid',
    email: 'test@agency.com',
    name: 'Test User',
    role: AgencyRole.ADMIN,
    org_id: 'org-uuid',
    sub_permissions: { 'view:reports': true },
    session_timeout: 30,
    mfa_enabled: false,
    mfa_type: MfaType.NONE,
    status: UserStatus.ACTIVE,
    email_verified: true,
    last_login: null,
  };

  beforeEach(() => {
    userDal = { get: jest.fn() };
    const configService = {
      get: jest.fn().mockImplementation((key: string, defaultVal: string) => {
        const config: Record<string, string> = {
          JWT_SECRET: 'test-secret',
        };
        return config[key] ?? defaultVal;
      }),
    } as unknown as ConfigService;

    strategy = new JwtStrategy(configService, userDal as never);
  });

  const payload: JwtPayload = {
    sub: 'user-uuid',
    email: 'test@agency.com',
    role: AgencyRole.ADMIN,
    org_id: 'org-uuid',
    mfa_verified: true,
  };

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return AuthenticatedUser for valid active user', async () => {
    userDal.get.mockResolvedValue(mockUser);

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: 'user-uuid',
      email: 'test@agency.com',
      name: 'Test User',
      role: AgencyRole.ADMIN,
      org_id: 'org-uuid',
      sub_permissions: { 'view:reports': true },
      session_timeout: 30,
      mfa_enabled: false,
      mfa_type: MfaType.NONE,
      email_verified: true,
      mfa_verified: true,
    });
  });

  it('should look up user by id', async () => {
    userDal.get.mockResolvedValue(mockUser);

    await strategy.validate(payload);

    expect(userDal.get).toHaveBeenCalledWith({
      identifierOptions: { id: 'user-uuid' },
    });
  });

  it('should throw UnauthorizedException when user not found', async () => {
    userDal.get.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for suspended user', async () => {
    userDal.get.mockResolvedValue({
      ...mockUser,
      status: UserStatus.SUSPENDED,
    });

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for archived user', async () => {
    userDal.get.mockResolvedValue({
      ...mockUser,
      status: UserStatus.ARCHIVED,
    });

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for pending invite user', async () => {
    userDal.get.mockResolvedValue({
      ...mockUser,
      status: UserStatus.PENDING_INVITE,
    });

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
