import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MfaGuard } from './mfa.guard';

describe('MfaGuard', () => {
  let guard: MfaGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new MfaGuard(reflector);
  });

  const createContext = (user: Record<string, unknown> | undefined) => {
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
    return context;
  };

  it('should pass for @Public() routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true);

    const context = createContext(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should pass for @MfaPending() routes', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    const context = createContext({ mfa_enabled: true, mfa_verified: false });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should pass when MFA is not enabled', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createContext({
      mfa_enabled: false,
      mfa_verified: true,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should pass when MFA enabled and verified', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createContext({
      mfa_enabled: true,
      mfa_verified: true,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw when MFA enabled but not verified', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createContext({
      mfa_enabled: true,
      mfa_verified: false,
    });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should return false when no user on request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createContext(undefined);
    expect(guard.canActivate(context)).toBe(false);
  });
});
