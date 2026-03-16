import { BadRequestException, Injectable } from '@nestjs/common';
import { OrganizationDal } from '@dals/organization.dal';
import { UserDal } from '@dals/user.dal';
import { SubscriptionDal } from '@dals/subscription.dal';
import { OnboardingChecklistDal } from '@dals/onboarding-checklist.dal';
import { OrgModuleDal } from '@dals/org-module.dal';
import { SignupApplicationDal } from '@dals/signup-application.dal';
import { AuditLogService } from './audit-log.service';
import { ApplicationStatus, APPLICATION_TRANSITIONS } from '@enums/application-status.enum';
import { OrgStatus } from '@enums/org-status.enum';
import { AgencyRole } from '@enums/role.enum';
import { SubscriptionStatus } from '@enums/subscription-status.enum';
import { BillingCycle } from '@enums/billing-cycle.enum';
import { OnboardingStatus } from '@enums/onboarding-status.enum';
import { validateTransition } from '@utils/state-machine';
import { type ProvisioningManifest } from '@app-types/superadmin.types';
import * as crypto from 'crypto';

const DEFAULT_MODULES = [
  'service_records',
  'scheduling',
  'evv',
  'billing',
  'incidents',
];

@Injectable()
export class TenantProvisioningService {
  constructor(
    private readonly organizationDal: OrganizationDal,
    private readonly userDal: UserDal,
    private readonly subscriptionDal: SubscriptionDal,
    private readonly checklistDal: OnboardingChecklistDal,
    private readonly orgModuleDal: OrgModuleDal,
    private readonly applicationDal: SignupApplicationDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async provision(
    applicationId: string,
    operatorId: string,
    ip: string,
    ua: string,
  ): Promise<ProvisioningManifest> {
    const application = await this.applicationDal.get({
      identifierOptions: { id: applicationId } as never,
    });

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    if (application.status !== ApplicationStatus.APPROVED) {
      throw new BadRequestException('Application must be APPROVED to provision');
    }

    // 1. Create organization
    const org = await this.organizationDal.create({
      createPayload: {
        legal_name: application.org_name,
        npi: application.npi,
        ein: application.ein,
        status: OrgStatus.PENDING,
        plan_tier: application.plan_tier,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    // 2. Create admin user with temp password
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const adminUser = await this.userDal.create({
      createPayload: {
        org_id: org.id,
        email: application.contact_email,
        name: application.contact_name,
        password: tempPassword,
        role: AgencyRole.ADMIN,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    // 3. Create subscription
    const subscription = await this.subscriptionDal.create({
      createPayload: {
        org_id: org.id,
        plan_tier: application.plan_tier ?? 'STARTER',
        status: SubscriptionStatus.TRIALING,
        billing_cycle: BillingCycle.MONTHLY,
        mrr_cents: 0,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    // 4. Create onboarding checklist
    const checklist = await this.checklistDal.create({
      createPayload: {
        org_id: org.id,
        status: OnboardingStatus.NOT_STARTED,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    // 5. Enable default modules
    const modulesEnabled: string[] = [];
    for (const moduleName of DEFAULT_MODULES) {
      await this.orgModuleDal.create({
        createPayload: {
          org_id: org.id,
          module_name: moduleName,
          enabled: true,
          enabled_by: operatorId,
          enabled_at: new Date(),
        } as never,
        transactionOptions: { useTransaction: false },
      });
      modulesEnabled.push(moduleName);
    }

    // 6. Transition application: APPROVED → PROVISIONING
    if (
      validateTransition(
        APPLICATION_TRANSITIONS,
        application.status,
        ApplicationStatus.PROVISIONING,
      )
    ) {
      await this.applicationDal.update({
        identifierOptions: { id: applicationId } as never,
        updatePayload: { status: ApplicationStatus.PROVISIONING } as never,
        transactionOptions: { useTransaction: false },
      });
    }

    // 7. Transition application: PROVISIONING → ONBOARDING
    if (
      validateTransition(
        APPLICATION_TRANSITIONS,
        ApplicationStatus.PROVISIONING,
        ApplicationStatus.ONBOARDING,
      )
    ) {
      await this.applicationDal.update({
        identifierOptions: { id: applicationId } as never,
        updatePayload: { status: ApplicationStatus.ONBOARDING } as never,
        transactionOptions: { useTransaction: false },
      });
    }

    // 8. Audit log
    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'TENANT_PROVISIONED',
      target_type: 'organizations',
      target_id: org.id,
      after_val: {
        org_id: org.id,
        admin_user_id: adminUser.id,
        subscription_id: subscription.id,
        checklist_id: checklist.id,
        modules_enabled: modulesEnabled,
      },
      ip_address: ip,
      user_agent: ua,
    });

    return {
      application_id: applicationId,
      org_id: org.id,
      admin_user_id: adminUser.id,
      subscription_id: subscription.id,
      checklist_id: checklist.id,
      modules_enabled: modulesEnabled,
    };
  }
}
