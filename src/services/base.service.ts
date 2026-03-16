import { Logger, type Provider } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from '@interceptors/response.interceptor';
import { TenantContextInterceptor } from '@interceptors/tenant-context.interceptor';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { PermissionsGuard } from '@guards/permissions.guard';
import { MfaGuard } from '@guards/mfa.guard';
import { AppService } from './app.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { MfaService } from './mfa.service';
import { AuditLogService } from './audit-log.service';
import { EmailService } from './email.service';
import { EncryptionService } from './encryption.service';
import { OrganizationService } from './organization.service';
import { SubPermissionsService } from './sub-permissions.service';
import { UserService } from './user.service';
import { ProgramService } from './program.service';
import { SiteService } from './site.service';
import { IndividualService } from './individual.service';
import { StaffAssignmentService } from './staff-assignment.service';

// Phase 3 Services
import { ServiceRecordService } from './service-record.service';
import { DailyNoteService } from './daily-note.service';
import { IspGoalService } from './isp-goal.service';
import { IspDataPointService } from './isp-data-point.service';
import { IncidentService } from './incident.service';
import { BehaviorPlanService } from './behavior-plan.service';
import { MarEntryService } from './mar-entry.service';
import { CorrectionRequestService } from './correction-request.service';

// Phase 4 Services
import { EvvPunchService } from './evv-punch.service';
import { EvvCorrectionService } from './evv-correction.service';

// Phase 5 Services
import { ShiftService } from './shift.service';

// ADL Tracking Services
import { AdlCategoryService } from './adl-category.service';
import { AdlEntryService } from './adl-entry.service';

// Phase 6A Services
import { PayerConfigService } from './payer-config.service';
import { ServiceCodeService } from './service-code.service';
import { RateTableService } from './rate-table.service';
import { ServiceAuthorizationService } from './service-authorization.service';
import { IndividualPayerCoverageService } from './individual-payer-coverage.service';
import { BillingQueueService } from './billing-queue.service';

// Phase 6B Services
import { ClaimService } from './claim.service';
import { ClaimLineService } from './claim-line.service';
import { ClaimMappingService } from './claim-mapping.service';
import { ClaimValidationService } from './claim-validation.service';
import { DenialHandlerService } from './denial-handler.service';

// Phase 6C Services
import { EdiGeneratorService } from './edi-generator.service';
import { ClaimSubmissionService } from './claim-submission.service';

// Phase 7 Services
import { RemittanceService } from './remittance.service';
import { PaymentMatchingService } from './payment-matching.service';
import { PaymentPostingService } from './payment-posting.service';
import { ArReportService } from './ar-report.service';

// Phase 8 Services
import { OperatorService } from './operator.service';
import { SignupApplicationService } from './signup-application.service';
import { RiskScoringService } from './risk-scoring.service';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { OnboardingService } from './onboarding.service';
import { AgencyManagementService } from './agency-management.service';
import { GlobalServiceCodeService } from './global-service-code.service';
import { GlobalPayerService } from './global-payer.service';
import { SubscriptionManagementService } from './subscription-management.service';
import { BreakGlassService } from './break-glass.service';

// Phase 9 Services
import { NotificationService } from './notification.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationTriggerService } from './notification-trigger.service';

// Phase 1 DALs
import { OrganizationDal } from '@dals/organization.dal';
import { UserDal } from '@dals/user.dal';
import { AuditLogDal } from '@dals/audit-log.dal';

// Phase 2 DALs
import { ProgramDal } from '@dals/program.dal';
import { SiteDal } from '@dals/site.dal';
import { IndividualDal } from '@dals/individual.dal';
import { StaffAssignmentDal } from '@dals/staff-assignment.dal';

// Phase 3 DALs
import { ServiceRecordDal } from '@dals/service-record.dal';
import { DailyNoteDal } from '@dals/daily-note.dal';
import { IspGoalDal } from '@dals/isp-goal.dal';
import { IspDataPointDal } from '@dals/isp-data-point.dal';
import { IncidentDal } from '@dals/incident.dal';
import { BehaviorPlanDal } from '@dals/behavior-plan.dal';
import { MarEntryDal } from '@dals/mar-entry.dal';
import { CorrectionRequestDal } from '@dals/correction-request.dal';

// ADL Tracking DALs
import { AdlCategoryDal } from '@dals/adl-category.dal';
import { AdlEntryDal } from '@dals/adl-entry.dal';

// Phase 4 DALs
import { EvvPunchDal } from '@dals/evv-punch.dal';
import { EvvCorrectionDal } from '@dals/evv-correction.dal';

// Phase 5 DALs
import { ShiftDal } from '@dals/shift.dal';

// Phase 6 DALs
import { PayerConfigDal } from '@dals/payer-config.dal';
import { ServiceCodeDal } from '@dals/service-code.dal';
import { RateTableDal } from '@dals/rate-table.dal';
import { ServiceAuthorizationDal } from '@dals/service-authorization.dal';
import { ClaimDal } from '@dals/claim.dal';
import { ClaimLineDal } from '@dals/claim-line.dal';
import { ClaimSubmissionDal } from '@dals/claim-submission.dal';
import { IndividualPayerCoverageDal } from '@dals/individual-payer-coverage.dal';
import { ClaimStatusHistoryDal } from '@dals/claim-status-history.dal';

// Phase 7 DALs
import { RemittanceDal } from '@dals/remittance.dal';
import { PaymentPostDal } from '@dals/payment-post.dal';
import { AdjustmentDal } from '@dals/adjustment.dal';

// Phase 8 DALs
import { SmarttrackOperatorDal } from '@dals/smarttrack-operator.dal';
import { PlanDefinitionDal } from '@dals/plan-definition.dal';
import { GlobalServiceCodeDal } from '@dals/global-service-code.dal';
import { GlobalPayerDal } from '@dals/global-payer.dal';
import { SignupApplicationDal } from '@dals/signup-application.dal';
import { ApplicationDocumentDal } from '@dals/application-document.dal';
import { ApplicationNoteDal } from '@dals/application-note.dal';
import { OrgContactDal } from '@dals/org-contact.dal';
import { SignedAgreementDal } from '@dals/signed-agreement.dal';
import { SubscriptionDal } from '@dals/subscription.dal';
import { InvoiceDal } from '@dals/invoice.dal';
import { OrgModuleDal } from '@dals/org-module.dal';
import { OrgFeatureFlagDal } from '@dals/org-feature-flag.dal';
import { OnboardingChecklistDal } from '@dals/onboarding-checklist.dal';
import { OnboardingTaskDal } from '@dals/onboarding-task.dal';
import { BreakGlassSessionDal } from '@dals/break-glass-session.dal';
import { PlatformAuditLogDal } from '@dals/platform-audit-log.dal';

// Phase 9 DALs
import { NotificationDal } from '@dals/notification.dal';
import { NotificationPreferenceDal } from '@dals/notification-preference.dal';

export const services: Provider[] = [
  Logger,

  // Core
  AppService,

  // Auth
  JwtStrategy,
  AuthService,
  TokenService,
  MfaService,
  AuditLogService,
  EmailService,
  EncryptionService,
  OrganizationService,
  SubPermissionsService,

  // Phase 2 Services
  UserService,
  ProgramService,
  SiteService,
  IndividualService,
  StaffAssignmentService,

  // Phase 3 Services
  ServiceRecordService,
  DailyNoteService,
  IspGoalService,
  IspDataPointService,
  IncidentService,
  BehaviorPlanService,
  MarEntryService,
  CorrectionRequestService,

  // Phase 4 Services
  EvvPunchService,
  EvvCorrectionService,

  // Phase 5 Services
  ShiftService,

  // ADL Tracking Services
  AdlCategoryService,
  AdlEntryService,

  // Phase 6A Services
  PayerConfigService,
  ServiceCodeService,
  RateTableService,
  ServiceAuthorizationService,
  IndividualPayerCoverageService,
  BillingQueueService,

  // Phase 6B Services
  ClaimService,
  ClaimLineService,
  ClaimMappingService,
  ClaimValidationService,
  DenialHandlerService,

  // Phase 6C Services
  EdiGeneratorService,
  ClaimSubmissionService,

  // Phase 7 Services
  RemittanceService,
  PaymentMatchingService,
  PaymentPostingService,
  ArReportService,

  // Phase 8 Services
  OperatorService,
  SignupApplicationService,
  RiskScoringService,
  TenantProvisioningService,
  OnboardingService,
  AgencyManagementService,
  GlobalServiceCodeService,
  GlobalPayerService,
  SubscriptionManagementService,
  BreakGlassService,

  // Phase 9 Services
  NotificationService,
  NotificationPreferenceService,
  NotificationDispatchService,
  NotificationTriggerService,

  // Guards
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
  {
    provide: APP_GUARD,
    useClass: MfaGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
  {
    provide: APP_GUARD,
    useClass: PermissionsGuard,
  },

  // Interceptors
  {
    provide: APP_INTERCEPTOR,
    useClass: TenantContextInterceptor,
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: ResponseInterceptor,
  },

  // Phase 1 DALs
  OrganizationDal,
  UserDal,
  AuditLogDal,

  // Phase 2 DALs
  ProgramDal,
  SiteDal,
  IndividualDal,
  StaffAssignmentDal,

  // Phase 3 DALs
  ServiceRecordDal,
  DailyNoteDal,
  IspGoalDal,
  IspDataPointDal,
  IncidentDal,
  BehaviorPlanDal,
  MarEntryDal,
  CorrectionRequestDal,

  // ADL Tracking DALs
  AdlCategoryDal,
  AdlEntryDal,

  // Phase 4 DALs
  EvvPunchDal,
  EvvCorrectionDal,

  // Phase 5 DALs
  ShiftDal,

  // Phase 6 DALs
  PayerConfigDal,
  ServiceCodeDal,
  RateTableDal,
  ServiceAuthorizationDal,
  ClaimDal,
  ClaimLineDal,
  ClaimSubmissionDal,
  IndividualPayerCoverageDal,
  ClaimStatusHistoryDal,

  // Phase 7 DALs
  RemittanceDal,
  PaymentPostDal,
  AdjustmentDal,

  // Phase 8 DALs
  SmarttrackOperatorDal,
  PlanDefinitionDal,
  GlobalServiceCodeDal,
  GlobalPayerDal,
  SignupApplicationDal,
  ApplicationDocumentDal,
  ApplicationNoteDal,
  OrgContactDal,
  SignedAgreementDal,
  SubscriptionDal,
  InvoiceDal,
  OrgModuleDal,
  OrgFeatureFlagDal,
  OnboardingChecklistDal,
  OnboardingTaskDal,
  BreakGlassSessionDal,
  PlatformAuditLogDal,

  // Phase 9 DALs
  NotificationDal,
  NotificationPreferenceDal,
];
