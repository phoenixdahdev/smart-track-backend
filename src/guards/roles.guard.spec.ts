import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { AgencyRole, PlatformRole } from '@enums/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: { role: string }): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access to public routes', () => {
    const context = createMockContext();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true); // isPublic

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when no roles are required', () => {
    const context = createMockContext({ role: AgencyRole.DSP });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce(null); // roles

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when empty roles array', () => {
    const context = createMockContext({ role: AgencyRole.DSP });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce([]); // roles

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has a required role', () => {
    const context = createMockContext({ role: AgencyRole.ADMIN });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce([AgencyRole.ADMIN, AgencyRole.SUPERVISOR]); // roles

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    const context = createMockContext({ role: AgencyRole.DSP });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce([AgencyRole.ADMIN]); // roles

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access when no user is present', () => {
    const context = createMockContext(undefined);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce([AgencyRole.ADMIN]); // roles

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should distinguish between platform and agency roles', () => {
    const context = createMockContext({ role: PlatformRole.PLATFORM_ADMIN });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce([AgencyRole.ADMIN]); // roles - agency role only

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow platform role when required', () => {
    const context = createMockContext({ role: PlatformRole.PLATFORM_OWNER });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce([
        PlatformRole.PLATFORM_OWNER,
        PlatformRole.PLATFORM_ADMIN,
      ]);

    expect(guard.canActivate(context)).toBe(true);
  });
});
