import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, lastValueFrom, throwError } from 'rxjs';
import { TenantContextInterceptor } from './tenant-context.interceptor';
import { type DataSource } from 'typeorm';

describe('TenantContextInterceptor', () => {
  let interceptor: TenantContextInterceptor;
  let reflector: Reflector;
  let dataSource: { createQueryRunner: jest.Mock };
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    query: jest.Mock;
  };

  beforeEach(() => {
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue(undefined),
    };
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };
    reflector = new Reflector();
    interceptor = new TenantContextInterceptor(
      dataSource as unknown as DataSource,
      reflector,
    );
  });

  const createMockContext = (
    user?: { org_id?: string | null } & Record<string, unknown>,
    isPublic = false,
  ): ExecutionContext => {
    const req = { user, queryRunner: undefined };
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(req),
      }),
    } as unknown as ExecutionContext;
  };

  const mockHandler = { handle: () => of('response') };

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should skip RLS for public routes', async () => {
    const context = createMockContext(undefined, true);

    const result = await lastValueFrom(
      interceptor.intercept(context, mockHandler),
    );

    expect(result).toBe('response');
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
  });

  it('should skip RLS when no user', async () => {
    const context = createMockContext(undefined, false);

    const result = await lastValueFrom(
      interceptor.intercept(context, mockHandler),
    );

    expect(result).toBe('response');
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
  });

  it('should skip RLS when user has no org_id (platform user)', async () => {
    const context = createMockContext({ org_id: null }, false);

    const result = await lastValueFrom(
      interceptor.intercept(context, mockHandler),
    );

    expect(result).toBe('response');
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
  });

  it('should set RLS context for tenant user', async () => {
    const orgId = '550e8400-e29b-41d4-a716-446655440000';
    const context = createMockContext({ org_id: orgId }, false);

    const result = await lastValueFrom(
      interceptor.intercept(context, mockHandler),
    );

    expect(result).toBe('response');
    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.query).toHaveBeenCalledWith(
      'SET LOCAL app.current_org_id = $1',
      [orgId],
    );
  });

  it('should rollback on handler error', async () => {
    const orgId = '550e8400-e29b-41d4-a716-446655440000';
    const context = createMockContext({ org_id: orgId }, false);
    const errorHandler = {
      handle: () => throwError(() => new Error('handler failed')),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, errorHandler)),
    ).rejects.toThrow('handler failed');

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('should skip RLS for invalid UUID format', async () => {
    const context = createMockContext({ org_id: 'not-a-uuid' }, false);
    const warnSpy = jest
      .spyOn(interceptor['logger'], 'warn')
      .mockImplementation();

    const result = await lastValueFrom(
      interceptor.intercept(context, mockHandler),
    );

    expect(result).toBe('response');
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should store queryRunner on request', async () => {
    const orgId = '550e8400-e29b-41d4-a716-446655440000';
    const context = createMockContext({ org_id: orgId }, false);
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Record<string, unknown>>();

    await lastValueFrom(interceptor.intercept(context, mockHandler));

    expect(req['queryRunner']).toBe(queryRunner);
  });
});
