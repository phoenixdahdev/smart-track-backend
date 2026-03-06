import { type ModuleMetadata } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { OrganizationController } from './organization.controller';

export const controllers: ModuleMetadata['controllers'] = [
  AppController,
  AuthController,
  OrganizationController,
];
