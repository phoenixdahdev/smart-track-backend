import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { SubPermissionsService } from '@services/sub-permissions.service';
import { AgencyRole } from '@enums/role.enum';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let subPermissionsService: SubPermissionsService;

  beforeEach(() => {
    reflector = new Reflector();
    subPermissionsService = new SubPermissionsService();
    guard = new PermissionsGuard(reflector, subPermissionsService);
  });

  const createMockContext = (
    user?: Record<string, unknown>,
  ): ExecutionContext =>
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
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when no permissions are required', () => {
    const context = createMockContext({ role: AgencyRole.DSP });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(null);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has all required permissions', () => {
    const context = createMockContext({
      id: 'user-1',
      email: 'test@test.com',
      role: AgencyRole.DSP,
      org_id: 'org-1',
      name: 'Test User',
      sub_permissions: { 'view:reports': true, 'edit:records': true },
      session_timeout: 30,
      mfa_enabled: false,
      email_verified: true,
    });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['view:reports', 'edit:records']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user lacks a required permission', () => {
    const context = createMockContext({
      id: 'user-1',
      email: 'test@test.com',
      role: AgencyRole.DSP,
      org_id: 'org-1',
      name: 'Test User',
      sub_permissions: { 'view:reports': true },
      session_timeout: 30,
      mfa_enabled: false,
      email_verified: true,
    });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['view:reports', 'edit:records']);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access when no user is present', () => {
    const context = createMockContext(undefined);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['view:reports']);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow when permissions array is empty', () => {
    const context = createMockContext({ role: AgencyRole.DSP });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([]);

    expect(guard.canActivate(context)).toBe(true);
  });
});
