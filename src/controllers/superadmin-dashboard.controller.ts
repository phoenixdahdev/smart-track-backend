import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrganizationDal } from '@dals/organization.dal';
import { SignupApplicationDal } from '@dals/signup-application.dal';
import { SubscriptionDal } from '@dals/subscription.dal';
import { Roles } from '@decorators/roles.decorator';
import { PlatformRole } from '@enums/role.enum';
import { OrgStatus } from '@enums/org-status.enum';
import { ApplicationStatus } from '@enums/application-status.enum';
import { SubscriptionStatus } from '@enums/subscription-status.enum';
import { type PlatformDashboardData } from '@app-types/superadmin.types';

@ApiTags('SuperAdmin — Dashboard')
@ApiBearerAuth()
@Roles(PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_ADMIN)
@Controller('superadmin/platform/health')
export class SuperadminDashboardController {
  constructor(
    private readonly orgDal: OrganizationDal,
    private readonly applicationDal: SignupApplicationDal,
    private readonly subscriptionDal: SubscriptionDal,
  ) {}

  @ApiOperation({ summary: 'Platform health dashboard' })
  @Get()
  async dashboard(): Promise<{ message: string; data: PlatformDashboardData }> {
    const [activeOrgs, pendingApps, activeSubscriptions] = await Promise.all([
      this.orgDal.find({
        findOptions: { status: OrgStatus.ACTIVE } as never,
        paginationPayload: { page: 1, limit: 1 },
        transactionOptions: { useTransaction: false },
      }),
      this.applicationDal.find({
        findOptions: { status: ApplicationStatus.SUBMITTED } as never,
        paginationPayload: { page: 1, limit: 1 },
        transactionOptions: { useTransaction: false },
      }),
      this.subscriptionDal.find({
        findOptions: { status: SubscriptionStatus.ACTIVE } as never,
        paginationPayload: { page: 1, limit: 1 },
        transactionOptions: { useTransaction: false },
      }),
    ]);

    // Build agencies by status
    const agenciesByStatus: Record<string, number> = {};
    for (const status of Object.values(OrgStatus)) {
      const result = await this.orgDal.find({
        findOptions: { status } as never,
        paginationPayload: { page: 1, limit: 1 },
        transactionOptions: { useTransaction: false },
      });
      agenciesByStatus[status] = result.paginationMeta.total ?? 0;
    }

    // Build applications by status
    const applicationsByStatus: Record<string, number> = {};
    for (const status of Object.values(ApplicationStatus)) {
      const result = await this.applicationDal.find({
        findOptions: { status } as never,
        paginationPayload: { page: 1, limit: 1 },
        transactionOptions: { useTransaction: false },
      });
      applicationsByStatus[status] = result.paginationMeta.total ?? 0;
    }

    const data: PlatformDashboardData = {
      active_agencies: activeOrgs.paginationMeta.total ?? 0,
      pending_applications: pendingApps.paginationMeta.total ?? 0,
      active_subscriptions: activeSubscriptions.paginationMeta.total ?? 0,
      total_mrr_cents: 0,
      agencies_by_status: agenciesByStatus,
      applications_by_status: applicationsByStatus,
    };

    return { message: 'Platform dashboard retrieved', data };
  }
}
