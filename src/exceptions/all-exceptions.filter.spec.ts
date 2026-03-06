import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { method: string; url: string };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {
      method: 'GET',
      url: '/api/v1/test',
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('HttpException handling', () => {
    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        { message: 'Resource not found', error: 'Not Found' },
        HttpStatus.NOT_FOUND,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 404,
          message: 'Resource not found',
          error: 'Not Found',
          success: false,
        }),
      );
    });

    it('should handle HttpException with string response', () => {
      const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Bad request',
          success: false,
        }),
      );
    });

    it('should handle validation errors (array of messages)', () => {
      const exception = new HttpException(
        {
          message: ['email must be an email', 'name should not be empty'],
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.message).toEqual([
        'email must be an email',
        'name should not be empty',
      ]);
    });
  });

  describe('non-HttpException handling', () => {
    it('should return 500 for unknown errors', () => {
      const exception = new Error('Something broke');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal server error',
          success: false,
        }),
      );
    });

    it('should never leak internal error details to client', () => {
      const exception = new Error(
        'Connection to database failed: host=db.internal password=secret123',
      );

      filter.catch(exception, mockHost);

      const jsonResponse = mockResponse.json.mock.calls[0][0];
      const responseString = JSON.stringify(jsonResponse);
      expect(responseString).not.toContain('database');
      expect(responseString).not.toContain('password');
      expect(responseString).not.toContain('secret123');
      expect(jsonResponse.message).toBe('Internal server error');
    });

    it('should handle non-Error objects thrown', () => {
      filter.catch('random string thrown', mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal server error',
          success: false,
        }),
      );
    });
  });

  describe('response format', () => {
    it('should include timestamp in response', () => {
      const exception = new HttpException('Test', 400);

      filter.catch(exception, mockHost);

      const jsonResponse = mockResponse.json.mock.calls[0][0];
      expect(jsonResponse.timestamp).toBeDefined();
    });

    it('should include request path in response', () => {
      const exception = new HttpException('Test', 400);

      filter.catch(exception, mockHost);

      const jsonResponse = mockResponse.json.mock.calls[0][0];
      expect(jsonResponse.path).toBe('/api/v1/test');
    });

    it('should convert keys to snake_case', () => {
      const exception = new HttpException(
        { message: 'Error', error: 'Bad Request' },
        400,
      );

      filter.catch(exception, mockHost);

      const jsonResponse = mockResponse.json.mock.calls[0][0];
      expect(jsonResponse.status_code).toBeDefined();
      expect(jsonResponse.statusCode).toBeUndefined();
    });
  });
});
