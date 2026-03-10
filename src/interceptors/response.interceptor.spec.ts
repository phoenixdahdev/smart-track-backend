import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

type InterceptorResponse = {
  message?: string;
  data?: Record<string, unknown>;
  success?: boolean;
  timestamp?: string;
  meta?: Record<string, unknown>;
};

type ErrorResponse = {
  message: string;
  success?: boolean;
  path?: string;
  timestamp?: string;
};

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;
  let reflector: Reflector;

  const createMockContext = (): ExecutionContext => {
    const mockResponse = {
      setHeader: jest.fn(),
    };
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          url: '/api/v1/test',
          method: 'GET',
        }),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;
  };

  const createCallHandler = (data?: unknown): CallHandler => ({
    handle: () => of(data),
  });

  const createErrorCallHandler = (error: Error): CallHandler => ({
    handle: () => throwError(() => error),
  });

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new ResponseInterceptor(reflector);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('response handling', () => {
    it('should wrap object response with standard envelope', (done) => {
      const context = createMockContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(reflector, 'get').mockReturnValue([]);

      const handler = createCallHandler({
        message: 'Test message',
        data: { id: '123' },
      });

      interceptor.intercept(context, handler).subscribe((result) => {
        const res = result as InterceptorResponse;
        expect(res.message).toBe('Test message');
        expect(res.data).toEqual({ id: '123' });
        expect(res.success).toBe(true);
        expect(res.timestamp).toBeDefined();
        done();
      });
    });

    it('should default message to Success when not provided', (done) => {
      const context = createMockContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(reflector, 'get').mockReturnValue([]);

      const handler = createCallHandler({ data: { id: '123' } });

      interceptor.intercept(context, handler).subscribe((result) => {
        const res = result as InterceptorResponse;
        expect(res.message).toBe('Success');
        done();
      });
    });

    it('should handle non-object responses', (done) => {
      const context = createMockContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(reflector, 'get').mockReturnValue([]);

      const handler = createCallHandler('plain string');

      interceptor.intercept(context, handler).subscribe((result) => {
        const res = result as InterceptorResponse;
        expect(res.message).toBe('Success');
        expect(res.success).toBe(true);
        done();
      });
    });

    it('should include pagination meta when provided', (done) => {
      const context = createMockContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(reflector, 'get').mockReturnValue([]);

      const handler = createCallHandler({
        data: [],
        message: 'Listed',
        meta: {
          total: 50,
          limit: 10,
          page: 1,
          total_pages: 5,
          has_next: true,
          has_previous: false,
        },
      });

      interceptor.intercept(context, handler).subscribe((result) => {
        const res = result as InterceptorResponse;
        expect(res.meta).toBeDefined();
        expect(res.meta?.['total']).toBe(50);
        done();
      });
    });

    it('should convert camelCase keys to snake_case', (done) => {
      const context = createMockContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(reflector, 'get').mockReturnValue([]);

      const handler = createCallHandler({
        data: { firstName: 'John', lastName: 'Doe' },
      });

      interceptor.intercept(context, handler).subscribe((result) => {
        const res = result as InterceptorResponse;
        expect(res.data?.['first_name']).toBe('John');
        expect(res.data?.['last_name']).toBe('Doe');
        expect(res.data?.['firstName']).toBeUndefined();
        done();
      });
    });
  });

  describe('PHI field stripping', () => {
    it('should strip default private fields (password, ssn, dateOfBirth)', (done) => {
      const context = createMockContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(reflector, 'get').mockReturnValue([]);

      const handler = createCallHandler({
        data: {
          id: '123',
          name: 'John',
          password: 'secret123',
          ssn: '123-45-6789',
          dateOfBirth: '1990-01-01',
        },
      });

      interceptor.intercept(context, handler).subscribe((result) => {
        const res = result as InterceptorResponse;
        expect(res.data?.['id']).toBe('123');
        expect(res.data?.['name']).toBe('John');
        expect(res.data?.['password']).toBeUndefined();
        expect(res.data?.['ssn']).toBeUndefined();
        // dateOfBirth is stripped before camelToSnake conversion
        expect(res.data?.['date_of_birth']).toBeUndefined();
        expect(res.data?.['dateOfBirth']).toBeUndefined();
        done();
      });
    });

    it('should strip decorator-specified private fields', (done) => {
      const context = createMockContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest
        .spyOn(reflector, 'get')
        .mockReturnValueOnce(['diagnosis']) // handler level
        .mockReturnValueOnce([]); // class level

      const handler = createCallHandler({
        data: { id: '123', diagnosis: 'sensitive-info' },
      });

      interceptor.intercept(context, handler).subscribe((result) => {
        const res = result as InterceptorResponse;
        expect(res.data?.['id']).toBe('123');
        expect(res.data?.['diagnosis']).toBeUndefined();
        done();
      });
    });
  });

  describe('skip interceptor', () => {
    it('should pass through when SkipResponseInterceptor is set', (done) => {
      const context = createMockContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const rawData = { raw: true };
      const handler = createCallHandler(rawData);

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(result).toEqual(rawData);
        done();
      });
    });
  });

  describe('error handling', () => {
    it('should format HttpException errors', (done) => {
      const context = createMockContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const handler = createErrorCallHandler(
        new HttpException(
          { message: 'Not found', error: 'Not Found' },
          HttpStatus.NOT_FOUND,
        ),
      );

      interceptor.intercept(context, handler).subscribe({
        error: (err: unknown) => {
          expect(err).toBeInstanceOf(HttpException);
          const httpErr = err as HttpException;
          expect(httpErr.getStatus()).toBe(404);
          const response = httpErr.getResponse() as ErrorResponse;
          expect(response.message).toBe('Not found');
          expect(response.success).toBe(false);
          done();
        },
      });
    });

    it('should handle non-HttpException as 500 without leaking details', (done) => {
      const context = createMockContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const handler = createErrorCallHandler(
        new Error('Database connection failed with PHI data'),
      );

      interceptor.intercept(context, handler).subscribe({
        error: (err: unknown) => {
          expect(err).toBeInstanceOf(InternalServerErrorException);
          const httpErr = err as InternalServerErrorException;
          const response = httpErr.getResponse() as ErrorResponse;
          expect(response.message).toBe('Internal server error');
          // Must never contain the original error details
          expect(JSON.stringify(response)).not.toContain('PHI');
          expect(JSON.stringify(response)).not.toContain('Database connection');
          done();
        },
      });
    });

    it('should include path and timestamp in error response', (done) => {
      const context = createMockContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const handler = createErrorCallHandler(
        new HttpException('Bad request', HttpStatus.BAD_REQUEST),
      );

      interceptor.intercept(context, handler).subscribe({
        error: (err: unknown) => {
          const httpErr = err as HttpException;
          const response = httpErr.getResponse() as ErrorResponse;
          expect(response.path).toBe('/api/v1/test');
          expect(response.timestamp).toBeDefined();
          done();
        },
      });
    });
  });
});
