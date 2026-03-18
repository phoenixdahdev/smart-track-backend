import compression from 'compression';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from '@exceptions/all-exceptions.filter';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { validateCriticalEnvVars } from '@utils/validate-env';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = app.get(Logger);
  const config = app.get(ConfigService);

  validateCriticalEnvVars(config, logger);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const isProduction = config.get<string>('NODE_ENV') === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:'],
              objectSrc: ["'none'"],
              frameSrc: ["'none'"],
              baseUri: ["'self'"],
            },
          }
        : false,
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use(compression());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SmartTrack Health API')
    .setDescription('HIPAA-compliant IDD care documentation & billing platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, documentFactory);

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api/docs'],
  });

  const corsOrigin = config.get<string>('CORS_ORIGIN', '');
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });

  const port = config.get<string>('PORT') || 3000;
  const server = await app.listen(port);
  server.setTimeout(
    parseInt(config.get<string>('REQUEST_TIMEOUT_MS', '30000'), 10),
  );
  logger.log(`SmartTrack API started on ${await app.getUrl()}`);
}
void bootstrap();
