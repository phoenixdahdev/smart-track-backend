import { type ModuleMetadata } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { OrganizationController } from './organization.controller';
import { UserController } from './user.controller';
import { ProgramController } from './program.controller';
import { SiteController } from './site.controller';
import { IndividualController } from './individual.controller';
import { StaffAssignmentController } from './staff-assignment.controller';

// Phase 3 — Staff Console
import { StaffServiceRecordController } from './staff-service-record.controller';
import { StaffDailyNoteController } from './staff-daily-note.controller';
import { StaffIspDataPointController } from './staff-isp-data-point.controller';
import { StaffIncidentController } from './staff-incident.controller';
import { StaffMarEntryController } from './staff-mar-entry.controller';
import { StaffCorrectionRequestController } from './staff-correction-request.controller';

// Phase 3 — Supervisor Console
import { SupervisorServiceRecordController } from './supervisor-service-record.controller';
import { SupervisorIncidentController } from './supervisor-incident.controller';
import { SupervisorCorrectionRequestController } from './supervisor-correction-request.controller';

// Phase 3 — Clinical Console
import { ClinicalIspGoalController } from './clinical-isp-goal.controller';
import { ClinicalBehaviorPlanController } from './clinical-behavior-plan.controller';

// Phase 3 — Admin Console (Service Records & Incidents)
import { AdminServiceRecordController } from './admin-service-record.controller';
import { AdminIncidentController } from './admin-incident.controller';

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
  // Phase 3 — Staff Console
  StaffServiceRecordController,
  StaffDailyNoteController,
  StaffIspDataPointController,
  StaffIncidentController,
  StaffMarEntryController,
  StaffCorrectionRequestController,
  // Phase 3 — Supervisor Console
  SupervisorServiceRecordController,
  SupervisorIncidentController,
  SupervisorCorrectionRequestController,
  // Phase 3 — Clinical Console
  ClinicalIspGoalController,
  ClinicalBehaviorPlanController,
  // Phase 3 — Admin Console
  AdminServiceRecordController,
  AdminIncidentController,
];
