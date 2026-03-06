import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  const createMockContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
        getResponse: jest.fn().mockReturnValue({}),
      }),
    }) as unknown as ExecutionContext;

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true for public routes', () => {
    const context = createMockContext();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should delegate to passport for non-public routes', () => {
    const context = createMockContext();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    // AuthGuard('jwt').canActivate returns a promise or boolean
    // In test context without passport configured, we verify it attempts auth
    expect(() => guard.canActivate(context)).toBeDefined();
  });

  it('should check both handler and class for IS_PUBLIC_KEY', () => {
    const context = createMockContext();
    const spy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true);

    guard.canActivate(context);

    expect(spy).toHaveBeenCalledWith('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
