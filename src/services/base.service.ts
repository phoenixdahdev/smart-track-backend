import { Logger, type Provider } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from '@interceptors/response.interceptor';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { AppService } from './app.service';

export const services: Provider[] = [
  Logger,

  // Core
  AppService,

  // Guards
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },

  // Interceptors
  {
    provide: APP_INTERCEPTOR,
    useClass: ResponseInterceptor,
  },
];
