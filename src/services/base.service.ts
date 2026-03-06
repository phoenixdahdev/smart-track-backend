import { Logger, type Provider } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from '@interceptors/response.interceptor';
import { TenantContextInterceptor } from '@interceptors/tenant-context.interceptor';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { PermissionsGuard } from '@guards/permissions.guard';
import { AppService } from './app.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { AuthService } from './auth.service';
import { AuditLogService } from './audit-log.service';
import { EncryptionService } from './encryption.service';
import { SubPermissionsService } from './sub-permissions.service';

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
  AuditLogService,
  EncryptionService,
  SubPermissionsService,

  // Guards
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
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
