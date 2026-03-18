import { type ConfigService } from '@nestjs/config';
import { type Logger } from '@nestjs/common';

export function validateCriticalEnvVars(
  config: ConfigService,
  logger: Logger,
): void {
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const errors: string[] = [];

  const jwtSecret = config.get<string>('JWT_SECRET', '');
  if (jwtSecret === 'change-me' || jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters and not the default value');
  }

  const jwtRefreshSecret = config.get<string>('JWT_REFRESH_SECRET', '');
  if (jwtRefreshSecret === 'change-me-refresh' || jwtRefreshSecret.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters and not the default value');
  }

  const encryptionKey = config.get<string>('ENCRYPTION_KEY', '');
  if (!encryptionKey || !/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    errors.push('ENCRYPTION_KEY must be exactly 64 hex characters');
  }

  const corsOrigin = config.get<string>('CORS_ORIGIN', '');
  if (corsOrigin === '*' || corsOrigin === '') {
    errors.push('CORS_ORIGIN must be set to specific origins, not wildcard or empty');
  }

  if (errors.length === 0) return;

  for (const error of errors) {
    if (isProduction) {
      logger.error(`[ENV] ${error}`);
    } else {
      logger.warn(`[ENV] ${error}`);
    }
  }

  if (isProduction) {
    throw new Error(
      `Critical environment validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}
