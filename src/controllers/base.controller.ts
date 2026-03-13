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

// Phase 4 — Staff Console (EVV)
import { StaffEvvPunchController } from './staff-evv-punch.controller';
import { StaffEvvCorrectionController } from './staff-evv-correction.controller';

// Phase 4 — Supervisor Console (EVV)
import { SupervisorEvvPunchController } from './supervisor-evv-punch.controller';
import { SupervisorEvvCorrectionController } from './supervisor-evv-correction.controller';

// Phase 4 — Admin Console (EVV)
import { AdminEvvPunchController } from './admin-evv-punch.controller';

// Phase 5 — Staff Console (Scheduling)
import { StaffShiftController } from './staff-shift.controller';

// Phase 5 — Supervisor Console (Scheduling)
import { SupervisorShiftController } from './supervisor-shift.controller';

// Phase 5 — Admin Console (Scheduling)
import { AdminShiftController } from './admin-shift.controller';

// Phase 6A — Admin Console (Billing Config)
import { AdminPayerConfigController } from './admin-payer-config.controller';
import { AdminServiceCodeController } from './admin-service-code.controller';
import { AdminRateTableController } from './admin-rate-table.controller';
import { AdminServiceAuthorizationController } from './admin-service-authorization.controller';
import { AdminIndividualPayerCoverageController } from './admin-individual-payer-coverage.controller';

// Phase 6A — Billing Console
import { BillingServiceAuthorizationController } from './billing-service-authorization.controller';
import { BillingIndividualPayerCoverageController } from './billing-individual-payer-coverage.controller';
import { BillingQueueController } from './billing-queue.controller';

// Phase 6B — Billing Console (Claims)
import { BillingClaimController } from './billing-claim.controller';
import { BillingClaimLineController } from './billing-claim-line.controller';

// Phase 6B — Admin Console (Claims)
import { AdminClaimController } from './admin-claim.controller';

// Phase 6C — Billing Console (Submissions)
import { BillingClaimSubmissionController } from './billing-claim-submission.controller';

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
  // Phase 4 — Staff Console (EVV)
  StaffEvvPunchController,
  StaffEvvCorrectionController,
  // Phase 4 — Supervisor Console (EVV)
  SupervisorEvvPunchController,
  SupervisorEvvCorrectionController,
  // Phase 4 — Admin Console (EVV)
  AdminEvvPunchController,
  // Phase 5 — Staff Console (Scheduling)
  StaffShiftController,
  // Phase 5 — Supervisor Console (Scheduling)
  SupervisorShiftController,
  // Phase 5 — Admin Console (Scheduling)
  AdminShiftController,
  // Phase 6A — Admin Console (Billing Config)
  AdminPayerConfigController,
  AdminServiceCodeController,
  AdminRateTableController,
  AdminServiceAuthorizationController,
  AdminIndividualPayerCoverageController,
  // Phase 6A — Billing Console
  BillingServiceAuthorizationController,
  BillingIndividualPayerCoverageController,
  BillingQueueController,
  // Phase 6B — Billing Console (Claims)
  BillingClaimController,
  BillingClaimLineController,
  // Phase 6B — Admin Console (Claims)
  AdminClaimController,
  // Phase 6C — Billing Console (Submissions)
  BillingClaimSubmissionController,
];
