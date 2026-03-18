import { type ModuleMetadata } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { MfaController } from './mfa.controller';
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

// ADL Tracking — Admin Console
import { AdminAdlCategoryController } from './admin-adl-category.controller';

// ADL Tracking — Staff Console
import { StaffAdlEntryController } from './staff-adl-entry.controller';

// ADL Tracking — Supervisor Console
import { SupervisorAdlEntryController } from './supervisor-adl-entry.controller';

// ADL Tracking — Clinical Console
import { ClinicalAdlEntryController } from './clinical-adl-entry.controller';

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

// Phase 7 — Billing Console (Payment Reconciliation)
import { BillingRemittanceController } from './billing-remittance.controller';
import { BillingPaymentPostController } from './billing-payment-post.controller';
import { BillingAdjustmentController } from './billing-adjustment.controller';
import { BillingArReportController } from './billing-ar-report.controller';

// Phase 7 — Admin Console (Remittances)
import { AdminRemittanceController } from './admin-remittance.controller';

// Phase 8 — SuperAdmin Console
import { SuperadminOperatorController } from './superadmin-operator.controller';
import { SuperadminApplicationController } from './superadmin-application.controller';
import { SuperadminOrgController } from './superadmin-org.controller';
import { SuperadminOnboardingController } from './superadmin-onboarding.controller';
import { SuperadminGlobalServiceCodeController } from './superadmin-global-service-code.controller';
import { SuperadminGlobalPayerController } from './superadmin-global-payer.controller';
import { SuperadminPlanController } from './superadmin-plan.controller';
import { SuperadminBreakGlassController } from './superadmin-break-glass.controller';
import { SuperadminAuditLogController } from './superadmin-audit-log.controller';
import { SuperadminDashboardController } from './superadmin-dashboard.controller';

// Phase 9 — Notifications
import { AdminNotificationController } from './admin-notification.controller';
import { BillingNotificationController } from './billing-notification.controller';
import { SupervisorNotificationController } from './supervisor-notification.controller';
import { StaffNotificationController } from './staff-notification.controller';
import { ClinicalNotificationController } from './clinical-notification.controller';

// Phase 10 — Guardian Portal
import { PortalIndividualController } from './portal-individual.controller';
import { PortalServiceRecordController } from './portal-service-record.controller';
import { PortalIncidentController } from './portal-incident.controller';
import { PortalIspController } from './portal-isp.controller';
import { PortalScheduleController } from './portal-schedule.controller';
import { PortalMarController } from './portal-mar.controller';
import { PortalAdlController } from './portal-adl.controller';
import { PortalNotificationController } from './portal-notification.controller';

// Phase 11 — Billing Console (Reports)
import { BillingClaimsAnalyticsController } from './billing-claims-analytics.controller';
import { BillingAuthorizationUsageReportController } from './billing-authorization-usage-report.controller';
// Phase 11 — Admin Console (Reports)
import { AdminClaimsAnalyticsController } from './admin-claims-analytics.controller';
import { AdminComplianceReportController } from './admin-compliance-report.controller';
import { AdminEvvReportController } from './admin-evv-report.controller';
import { AdminStaffUtilizationReportController } from './admin-staff-utilization-report.controller';
import { AdminAuthorizationUsageReportController } from './admin-authorization-usage-report.controller';
// Phase 11 — Supervisor Console (Reports)
import { SupervisorComplianceReportController } from './supervisor-compliance-report.controller';
import { SupervisorEvvReportController } from './supervisor-evv-report.controller';
import { SupervisorStaffUtilizationReportController } from './supervisor-staff-utilization-report.controller';
// Phase 11 — SuperAdmin Console (Analytics)
import { SuperadminAnalyticsController } from './superadmin-analytics.controller';

export const controllers: ModuleMetadata['controllers'] = [
  AppController,
  AuthController,
  MfaController,
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
  // ADL Tracking
  AdminAdlCategoryController,
  StaffAdlEntryController,
  SupervisorAdlEntryController,
  ClinicalAdlEntryController,
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
  // Phase 7 — Billing Console (Payment Reconciliation)
  BillingRemittanceController,
  BillingPaymentPostController,
  BillingAdjustmentController,
  BillingArReportController,
  // Phase 7 — Admin Console (Remittances)
  AdminRemittanceController,
  // Phase 8 — SuperAdmin Console
  SuperadminOperatorController,
  SuperadminApplicationController,
  SuperadminOrgController,
  SuperadminOnboardingController,
  SuperadminGlobalServiceCodeController,
  SuperadminGlobalPayerController,
  SuperadminPlanController,
  SuperadminBreakGlassController,
  SuperadminAuditLogController,
  SuperadminDashboardController,
  // Phase 9 — Notifications
  AdminNotificationController,
  BillingNotificationController,
  SupervisorNotificationController,
  StaffNotificationController,
  ClinicalNotificationController,
  // Phase 10 — Guardian Portal
  PortalIndividualController,
  PortalServiceRecordController,
  PortalIncidentController,
  PortalIspController,
  PortalScheduleController,
  PortalMarController,
  PortalAdlController,
  PortalNotificationController,
  // Phase 11 — Billing Console (Reports)
  BillingClaimsAnalyticsController,
  BillingAuthorizationUsageReportController,
  // Phase 11 — Admin Console (Reports)
  AdminClaimsAnalyticsController,
  AdminComplianceReportController,
  AdminEvvReportController,
  AdminStaffUtilizationReportController,
  AdminAuthorizationUsageReportController,
  // Phase 11 — Supervisor Console (Reports)
  SupervisorComplianceReportController,
  SupervisorEvvReportController,
  SupervisorStaffUtilizationReportController,
  // Phase 11 — SuperAdmin Console (Analytics)
  SuperadminAnalyticsController,
];
