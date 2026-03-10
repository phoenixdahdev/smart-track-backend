import { type ModuleMetadata } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { OrganizationController } from './organization.controller';
import { UserController } from './user.controller';
import { ProgramController } from './program.controller';
import { SiteController } from './site.controller';
import { IndividualController } from './individual.controller';
import { StaffAssignmentController } from './staff-assignment.controller';

export const controllers: ModuleMetadata['controllers'] = [
  AppController,
  AuthController,
  OrganizationController,
  // Phase 2 — Admin Console
  UserController,
  ProgramController,
  SiteController,
  IndividualController,
  StaffAssignmentController,
];
