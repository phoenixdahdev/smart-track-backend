import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';
import { DataSource, QueryRunner } from 'typeorm';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap, finalize } from 'rxjs/operators';
import { IS_PUBLIC_KEY } from '@decorators/roles.decorator';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

declare module 'express' {
  interface Request {
    queryRunner?: QueryRunner;
  }
}

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantContextInterceptor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest<Request>();
    const orgId = req.user?.org_id;

    if (isPublic || !req.user || !orgId) {
      return next.handle();
    }

    if (!UUID_REGEX.test(orgId)) {
      this.logger.warn(`Invalid org_id format: ${orgId}`);
      return next.handle();
    }

    const queryRunner = this.dataSource.createQueryRunner();

    return from(this.setupTenantContext(queryRunner, orgId, req)).pipe(
      switchMap(() => next.handle()),
      catchError((err: unknown) =>
        from(queryRunner.rollbackTransaction()).pipe(
          switchMap(() => throwError(() => err)),
        ),
      ),
      finalize(() => {
        void queryRunner
          .commitTransaction()
          .catch(() => {
            // commit may fail if already rolled back
          })
          .finally(() => {
            void queryRunner.release();
          });
      }),
    );
  }

  private async setupTenantContext(
    queryRunner: QueryRunner,
    orgId: string,
    req: Request,
  ): Promise<void> {
    await queryRunner.connect();
    await queryRunner.startTransaction();
    await queryRunner.query(`SET LOCAL app.current_org_id = $1`, [orgId]);
    req.queryRunner = queryRunner;
  }
}
