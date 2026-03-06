import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import camelToSnake from '@utils/camel-to-snake-case';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;

    const status: number = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, error } = this.extractDetails(exception);

    const errorResponse = camelToSnake({
      statusCode: status,
      message,
      error: error ?? undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
      success: false,
    });

    response.status(status).json(errorResponse);

    const logMessage = Array.isArray(message) ? message.join(', ') : message;
    const logPayload = `[${request.method}] ${request.url} ${status} - ${logMessage}`;

    if (status >= 500) {
      this.logger.error(
        logPayload,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(logPayload);
    }
  }

  private extractDetails(exception: unknown): {
    message: string | string[];
    error: string | undefined;
  } {
    if (!(exception instanceof HttpException)) {
      return { message: 'Internal server error', error: undefined };
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return { message: response, error: undefined };
    }

    if (typeof response === 'object' && response !== null) {
      const res = response as Record<string, unknown>;
      return {
        message:
          (res.message as string | string[]) ?? 'Internal server error',
        error: (res.error as string) ?? undefined,
      };
    }

    return { message: 'Internal server error', error: undefined };
  }
}
