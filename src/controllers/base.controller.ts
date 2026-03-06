import { type ModuleMetadata } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthController } from './auth.controller';

export const controllers: ModuleMetadata['controllers'] = [
  AppController,
  AuthController,
];
