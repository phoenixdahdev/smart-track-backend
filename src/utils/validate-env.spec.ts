import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateCriticalEnvVars } from './validate-env';

describe('validateCriticalEnvVars', () => {
  let logger: Logger;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger('TestValidateEnv');
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation();
    errorSpy = jest.spyOn(logger, 'error').mockImplementation();
  });

  const makeConfig = (overrides: Record<string, string> = {}): ConfigService => {
    const defaults: Record<string, string> = {
      NODE_ENV: 'development',
      JWT_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      ENCRYPTION_KEY: 'a'.repeat(64),
      CORS_ORIGIN: 'http://localhost:3001',
      ...overrides,
    };
    return {
      get: jest.fn((key: string, fallback?: string) => defaults[key] ?? fallback ?? ''),
    } as unknown as ConfigService;
  };

  it('should pass with valid config', () => {
    expect(() => validateCriticalEnvVars(makeConfig(), logger)).not.toThrow();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should warn in dev when JWT_SECRET is default', () => {
    validateCriticalEnvVars(makeConfig({ JWT_SECRET: 'change-me' }), logger);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('JWT_SECRET'));
  });

  it('should warn in dev when JWT_SECRET is too short', () => {
    validateCriticalEnvVars(makeConfig({ JWT_SECRET: 'short' }), logger);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('JWT_SECRET'));
  });

  it('should warn in dev when JWT_REFRESH_SECRET is default', () => {
    validateCriticalEnvVars(makeConfig({ JWT_REFRESH_SECRET: 'change-me-refresh' }), logger);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('JWT_REFRESH_SECRET'));
  });

  it('should warn in dev when ENCRYPTION_KEY is invalid', () => {
    validateCriticalEnvVars(makeConfig({ ENCRYPTION_KEY: 'not-hex' }), logger);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('ENCRYPTION_KEY'));
  });

  it('should warn in dev when CORS_ORIGIN is wildcard', () => {
    validateCriticalEnvVars(makeConfig({ CORS_ORIGIN: '*' }), logger);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('CORS_ORIGIN'));
  });

  it('should throw in production with invalid config', () => {
    const config = makeConfig({ NODE_ENV: 'production', JWT_SECRET: 'change-me' });
    expect(() => validateCriticalEnvVars(config, logger)).toThrow(
      'Critical environment validation failed',
    );
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should not throw in production with valid config', () => {
    const config = makeConfig({ NODE_ENV: 'production' });
    expect(() => validateCriticalEnvVars(config, logger)).not.toThrow();
  });
});
