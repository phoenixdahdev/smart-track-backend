import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationDal } from '@dals/organization.dal';
import { SubscriptionDal } from '@dals/subscription.dal';
import { OrgContactDal } from '@dals/org-contact.dal';
import { SignedAgreementDal } from '@dals/signed-agreement.dal';
import { OrgModuleDal } from '@dals/org-module.dal';
import { OrgFeatureFlagDal } from '@dals/org-feature-flag.dal';
import { AuditLogService } from './audit-log.service';
import { type PaginationValidator } from '@utils/pagination-utils';
import { type OrgStatus } from '@enums/org-status.enum';

@Injectable()
export class AgencyManagementService {
  constructor(
    private readonly organizationDal: OrganizationDal,
    private readonly subscriptionDal: SubscriptionDal,
    private readonly contactDal: OrgContactDal,
    private readonly agreementDal: SignedAgreementDal,
    private readonly moduleDal: OrgModuleDal,
    private readonly featureFlagDal: OrgFeatureFlagDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listOrganizations(
    pagination?: PaginationValidator,
    filters?: { status?: OrgStatus; plan_tier?: string; state?: string },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {};
    if (filters?.status) findOptions.status = filters.status;
    if (filters?.plan_tier) findOptions.plan_tier = filters.plan_tier;
    if (filters?.state) findOptions.state = filters.state;

    return this.organizationDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async getOrganization(id: string) {
    const org = await this.organizationDal.get({
      identifierOptions: { id } as never,
    });

    if (!org) {
      throw new NotFoundException();
    }

    return org;
  }

  async updateOrgStatus(
    id: string,
    status: OrgStatus,
    reason: string,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const org = await this.getOrganization(id);

    const updatePayload: Record<string, unknown> = { status };
    if (status === ('TERMINATED' as OrgStatus)) {
      updatePayload.terminated_at = new Date();
    }

    const updated = await this.organizationDal.update({
      identifierOptions: { id } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: `ORG_${status}`,
      target_type: 'organizations',
      target_id: id,
      before_val: { status: org.status },
      after_val: { status, reason },
      ip_address: ip,
      user_agent: ua,
    });

    return updated;
  }

  async getContacts(orgId: string) {
    return this.contactDal.find({
      findOptions: { org_id: orgId } as never,
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async getAgreements(orgId: string) {
    return this.agreementDal.find({
      findOptions: { org_id: orgId } as never,
      order: { signed_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async toggleModule(
    orgId: string,
    moduleName: string,
    enabled: boolean,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const existing = await this.moduleDal.get({
      identifierOptions: { org_id: orgId, module_name: moduleName } as never,
    });

    let resultId: string;
    if (existing) {
      const updatePayload: Record<string, unknown> = { enabled };
      if (enabled) {
        updatePayload.enabled_by = operatorId;
        updatePayload.enabled_at = new Date();
        updatePayload.disabled_by = null;
        updatePayload.disabled_at = null;
      } else {
        updatePayload.disabled_by = operatorId;
        updatePayload.disabled_at = new Date();
      }

      await this.moduleDal.update({
        identifierOptions: { id: existing.id } as never,
        updatePayload: updatePayload as never,
        transactionOptions: { useTransaction: false },
      });
      resultId = existing.id;
    } else {
      const created = await this.moduleDal.create({
        createPayload: {
          org_id: orgId,
          module_name: moduleName,
          enabled,
          enabled_by: enabled ? operatorId : null,
          enabled_at: enabled ? new Date() : null,
        } as never,
        transactionOptions: { useTransaction: false },
      });
      resultId = created.id;
    }

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: enabled ? 'MODULE_ENABLED' : 'MODULE_DISABLED',
      target_type: 'org_modules',
      target_id: resultId,
      after_val: { org_id: orgId, module_name: moduleName, enabled },
      ip_address: ip,
      user_agent: ua,
    });

    const updated = await this.moduleDal.get({
      identifierOptions: { id: resultId } as never,
    });
    return updated;
  }

  async setFeatureFlag(
    orgId: string,
    flagName: string,
    value: unknown,
    operatorId: string,
    notes?: string,
    ip?: string,
    ua?: string,
  ) {
    const existing = await this.featureFlagDal.get({
      identifierOptions: { org_id: orgId, flag_name: flagName } as never,
    });

    let resultId: string;
    if (existing) {
      await this.featureFlagDal.update({
        identifierOptions: { id: existing.id } as never,
        updatePayload: {
          value,
          set_by: operatorId,
          set_at: new Date(),
          notes: notes ?? null,
        } as never,
        transactionOptions: { useTransaction: false },
      });
      resultId = existing.id;
    } else {
      const created = await this.featureFlagDal.create({
        createPayload: {
          org_id: orgId,
          flag_name: flagName,
          value,
          set_by: operatorId,
          set_at: new Date(),
          notes: notes ?? null,
        } as never,
        transactionOptions: { useTransaction: false },
      });
      resultId = created.id;
    }

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'FEATURE_FLAG_SET',
      target_type: 'org_feature_flags',
      target_id: resultId,
      after_val: { org_id: orgId, flag_name: flagName, value: value as Record<string, unknown> },
      ip_address: ip ?? '',
      user_agent: ua,
    });

    const updated = await this.featureFlagDal.get({
      identifierOptions: { id: resultId } as never,
    });
    return updated;
  }

  async getModules(orgId: string) {
    return this.moduleDal.find({
      findOptions: { org_id: orgId } as never,
      order: { module_name: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async getFeatureFlags(orgId: string) {
    return this.featureFlagDal.find({
      findOptions: { org_id: orgId } as never,
      order: { flag_name: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }
}
