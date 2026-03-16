import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request, type Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import camelToSnake from '@utils/camel-to-snake-case';
import { type PaginationMeta } from '@utils/pagination-utils';
import { IS_PRIVATE_KEY } from '@decorators/private.decorator';
import { SKIP_RESPONSE_INTERCEPTOR } from '@decorators/skip-response-interceptor.decorator';

type ResponseData = {
  message?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
  meta?: PaginationMeta;
  success: boolean;
};

const DEFAULT_PRIVATE_FIELDS = [
  'password',
  'ssn',
  'dateOfBirth',
  'mfaSecret',
  'mfaOtpCode',
  'mfaBackupCodes',
  'mfaLockedUntil',
];

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skipInterceptor = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_INTERCEPTOR,
      [context.getHandler(), context.getClass()],
    );

    if (skipInterceptor) {
      return next.handle();
    }

    return next.handle().pipe(
      map((res: unknown) => this.responseHandler(res, context)),
      catchError((err: unknown) => {
        const transformedError = this.errorHandler(err, context);
        return throwError(() => transformedError);
      }),
    );
  }

  errorHandler(exception: unknown, context: ExecutionContext): HttpException {
    const req = context.switchToHttp().getRequest<Request>();

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const status = exception.getStatus();

      if (typeof response === 'object') {
        const formattedResponse = camelToSnake({
          message:
            typeof response === 'object' && 'message' in response
              ? response['message']
              : exception.message,
          error:
            typeof response === 'object' && 'error' in response
              ? response['error']
              : undefined,
          timestamp: new Date().toISOString(),
          path: req.url,
          success: false,
        });

        return new HttpException(formattedResponse, status);
      }

      return new HttpException(
        camelToSnake({
          message: exception.message,
          timestamp: new Date().toISOString(),
          path: req.url,
          success: false,
        }),
        status,
      );
    }

    const errorMessage =
      exception instanceof Error ? exception.message : 'Unknown error';
    const errorStack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      `Error processing ${req.method} ${req.url}: ${errorMessage}`,
      errorStack,
    );

    return new InternalServerErrorException(
      camelToSnake({
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        path: req.url,
        success: false,
      }),
    );
  }

  responseHandler(res: unknown, context: ExecutionContext): ResponseData {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.setHeader('Content-Type', 'application/json');

    const privateFieldSet = this.getPrivateFieldSet(context);

    if (typeof res === 'object' && res !== null) {
      const { message, data, meta } = res as ResponseData;

      return camelToSnake(
        {
          message: message || 'Success',
          data: data ? data : undefined,
          meta: meta || undefined,
          timestamp: new Date().toISOString(),
          success: true,
        },
        privateFieldSet,
      ) as ResponseData;
    }

    return camelToSnake(
      {
        message: 'Success',
        data: res as Record<string, unknown>,
        timestamp: new Date().toISOString(),
        success: true,
      },
      privateFieldSet,
    ) as ResponseData;
  }

  private getPrivateFieldSet(context: ExecutionContext): Set<string> {
    const decoratorPrivateFields =
      this.reflector.get<string[]>(IS_PRIVATE_KEY, context.getHandler()) || [];
    const classLevelPrivateFields =
      this.reflector.get<string[]>(IS_PRIVATE_KEY, context.getClass()) || [];

    return new Set([
      ...DEFAULT_PRIVATE_FIELDS,
      ...classLevelPrivateFields,
      ...decoratorPrivateFields,
    ]);
  }
}
