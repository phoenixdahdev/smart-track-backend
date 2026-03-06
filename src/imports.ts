import { ConfigModule, ConfigService } from '@nestjs/config';
import { type ModuleMetadata } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@database/database.module';

// Phase 1
import { OrganizationEntity } from '@entities/organization.entity';
import { UserEntity } from '@entities/user.entity';
import { AuditLogEntity } from '@entities/audit-log.entity';

// Phase 2
import { ProgramEntity } from '@entities/program.entity';
import { SiteEntity } from '@entities/site.entity';
import { IndividualEntity } from '@entities/individual.entity';
import { StaffAssignmentEntity } from '@entities/staff-assignment.entity';

// Phase 3
import { ServiceRecordEntity } from '@entities/service-record.entity';
import { DailyNoteEntity } from '@entities/daily-note.entity';
import { IspGoalEntity } from '@entities/isp-goal.entity';
import { IspDataPointEntity } from '@entities/isp-data-point.entity';
import { IncidentEntity } from '@entities/incident.entity';
import { BehaviorPlanEntity } from '@entities/behavior-plan.entity';
import { MarEntryEntity } from '@entities/mar-entry.entity';
import { CorrectionRequestEntity } from '@entities/correction-request.entity';

// Phase 4
import { EvvPunchEntity } from '@entities/evv-punch.entity';
import { EvvCorrectionEntity } from '@entities/evv-correction.entity';

// Phase 5
import { ShiftEntity } from '@entities/shift.entity';

// Phase 6
import { PayerConfigEntity } from '@entities/payer-config.entity';
import { ServiceCodeEntity } from '@entities/service-code.entity';
import { RateTableEntity } from '@entities/rate-table.entity';
import { ServiceAuthorizationEntity } from '@entities/service-authorization.entity';
import { ClaimEntity } from '@entities/claim.entity';
import { ClaimLineEntity } from '@entities/claim-line.entity';
import { ClaimSubmissionEntity } from '@entities/claim-submission.entity';

// Phase 7
import { RemittanceEntity } from '@entities/remittance.entity';
import { PaymentPostEntity } from '@entities/payment-post.entity';
import { AdjustmentEntity } from '@entities/adjustment.entity';

// Phase 8
import { SmarttrackOperatorEntity } from '@entities/smarttrack-operator.entity';
import { PlanDefinitionEntity } from '@entities/plan-definition.entity';
import { GlobalServiceCodeEntity } from '@entities/global-service-code.entity';
import { GlobalPayerEntity } from '@entities/global-payer.entity';
import { SignupApplicationEntity } from '@entities/signup-application.entity';
import { ApplicationDocumentEntity } from '@entities/application-document.entity';
import { ApplicationNoteEntity } from '@entities/application-note.entity';
import { OrgContactEntity } from '@entities/org-contact.entity';
import { SignedAgreementEntity } from '@entities/signed-agreement.entity';
import { SubscriptionEntity } from '@entities/subscription.entity';
import { InvoiceEntity } from '@entities/invoice.entity';
import { OrgModuleEntity } from '@entities/org-module.entity';
import { OrgFeatureFlagEntity } from '@entities/org-feature-flag.entity';
import { OnboardingChecklistEntity } from '@entities/onboarding-checklist.entity';
import { OnboardingTaskEntity } from '@entities/onboarding-task.entity';
import { BreakGlassSessionEntity } from '@entities/break-glass-session.entity';
import { PlatformAuditLogEntity } from '@entities/platform-audit-log.entity';

// Phase 9
import { NotificationEntity } from '@entities/notification.entity';
import { NotificationPreferenceEntity } from '@entities/notification-preference.entity';

export const imports: ModuleMetadata['imports'] = [
  ConfigModule.forRoot({ isGlobal: true }),
  DatabaseModule,
  PassportModule.register({ defaultStrategy: 'jwt' }),
  JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      secret: config.get<string>('JWT_SECRET', 'change-me'),
      signOptions: { expiresIn: '15m' },
    }),
  }),
  TypeOrmModule.forFeature([
    // Phase 1
    OrganizationEntity,
    UserEntity,
    AuditLogEntity,

    // Phase 2
    ProgramEntity,
    SiteEntity,
    IndividualEntity,
    StaffAssignmentEntity,

    // Phase 3
    ServiceRecordEntity,
    DailyNoteEntity,
    IspGoalEntity,
    IspDataPointEntity,
    IncidentEntity,
    BehaviorPlanEntity,
    MarEntryEntity,
    CorrectionRequestEntity,

    // Phase 4
    EvvPunchEntity,
    EvvCorrectionEntity,

    // Phase 5
    ShiftEntity,

    // Phase 6
    PayerConfigEntity,
    ServiceCodeEntity,
    RateTableEntity,
    ServiceAuthorizationEntity,
    ClaimEntity,
    ClaimLineEntity,
    ClaimSubmissionEntity,

    // Phase 7
    RemittanceEntity,
    PaymentPostEntity,
    AdjustmentEntity,

    // Phase 8
    SmarttrackOperatorEntity,
    PlanDefinitionEntity,
    GlobalServiceCodeEntity,
    GlobalPayerEntity,
    SignupApplicationEntity,
    ApplicationDocumentEntity,
    ApplicationNoteEntity,
    OrgContactEntity,
    SignedAgreementEntity,
    SubscriptionEntity,
    InvoiceEntity,
    OrgModuleEntity,
    OrgFeatureFlagEntity,
    OnboardingChecklistEntity,
    OnboardingTaskEntity,
    BreakGlassSessionEntity,
    PlatformAuditLogEntity,

    // Phase 9
    NotificationEntity,
    NotificationPreferenceEntity,
  ]),
];
