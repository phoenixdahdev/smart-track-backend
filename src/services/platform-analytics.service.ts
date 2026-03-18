import { Injectable } from '@nestjs/common';
import { OrganizationDal } from '@dals/organization.dal';
import { SubscriptionDal } from '@dals/subscription.dal';
import { ClaimDal } from '@dals/claim.dal';
import { UserDal } from '@dals/user.dal';
import { OrgStatus } from '@enums/org-status.enum';
import { SubscriptionStatus } from '@enums/subscription-status.enum';
import { ClaimStatus } from '@enums/claim-status.enum';
import { UserStatus } from '@enums/user-status.enum';
import {
  type PlatformAnalyticsReport,
  type MrrByTier,
  type AgencyHealthScore,
} from '@app-types/reporting.types';

@Injectable()
export class PlatformAnalyticsService {
  constructor(
    private readonly organizationDal: OrganizationDal,
    private readonly subscriptionDal: SubscriptionDal,
    private readonly claimDal: ClaimDal,
    private readonly userDal: UserDal,
  ) {}

  async getPlatformAnalytics(): Promise<PlatformAnalyticsReport> {
    // Load all orgs
    const orgs = await this.organizationDal.find({
      findOptions: {} as never,
      transactionOptions: { useTransaction: false },
    });

    const totalAgencies = orgs.payload.length;
    const agenciesByStatus: Record<string, number> = {};
    for (const org of orgs.payload) {
      agenciesByStatus[org.status] = (agenciesByStatus[org.status] ?? 0) + 1;
    }
    const activeAgencies = agenciesByStatus[OrgStatus.ACTIVE] ?? 0;

    // Load subscriptions for MRR
    const subscriptions = await this.subscriptionDal.find({
      findOptions: { status: SubscriptionStatus.ACTIVE } as never,
      transactionOptions: { useTransaction: false },
    });

    let totalMrrCents = 0;
    const tierMap = new Map<string, { count: number; mrr_cents: number }>();
    for (const sub of subscriptions.payload) {
      const mrr = Number(sub.mrr_cents);
      totalMrrCents += mrr;
      const tier = sub.plan_tier ?? 'unknown';
      if (!tierMap.has(tier)) {
        tierMap.set(tier, { count: 0, mrr_cents: 0 });
      }
      const t = tierMap.get(tier)!;
      t.count++;
      t.mrr_cents += mrr;
    }

    const mrr_by_tier: MrrByTier[] = Array.from(tierMap.entries()).map(
      ([tier, data]) => ({ tier, count: data.count, mrr_cents: data.mrr_cents }),
    );

    // Load all claims for platform-wide stats
    const claims = await this.claimDal.find({
      findOptions: {} as never,
      transactionOptions: { useTransaction: false },
    });

    const claimsByStatusPlatform: Record<string, number> = {};
    for (const claim of claims.payload) {
      claimsByStatusPlatform[claim.status] = (claimsByStatusPlatform[claim.status] ?? 0) + 1;
    }

    const avgClaimsPerAgency = activeAgencies > 0
      ? Math.round(claims.payload.length / activeAgencies)
      : 0;

    // Health scores
    const healthScores = await this.getAgencyHealthScores();

    return {
      total_agencies: totalAgencies,
      active_agencies: activeAgencies,
      total_mrr_cents: totalMrrCents,
      mrr_by_tier,
      agencies_by_status: agenciesByStatus,
      claims_by_status_platform: claimsByStatusPlatform,
      avg_claims_per_agency: avgClaimsPerAgency,
      agency_health_scores: healthScores,
    };
  }

  async getAgencyHealthScores(): Promise<AgencyHealthScore[]> {
    const orgs = await this.organizationDal.find({
      findOptions: { status: OrgStatus.ACTIVE } as never,
      transactionOptions: { useTransaction: false },
    });

    const users = await this.userDal.find({
      findOptions: { status: UserStatus.ACTIVE } as never,
      transactionOptions: { useTransaction: false },
    });

    const claims = await this.claimDal.find({
      findOptions: {} as never,
      transactionOptions: { useTransaction: false },
    });

    // Group users by org
    const usersByOrg = new Map<string, number>();
    for (const user of users.payload) {
      if (user.org_id) {
        usersByOrg.set(user.org_id, (usersByOrg.get(user.org_id) ?? 0) + 1);
      }
    }

    // Group claims by org — last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const claimsByOrg = new Map<string, { submitted: number; paid: number; denied: number }>();
    for (const claim of claims.payload) {
      if (!claim.org_id) continue;
      if (!claimsByOrg.has(claim.org_id)) {
        claimsByOrg.set(claim.org_id, { submitted: 0, paid: 0, denied: 0 });
      }
      const orgClaims = claimsByOrg.get(claim.org_id)!;

      // Count submitted in last 30 days
      const submittedDate = claim.submitted_at ? new Date(claim.submitted_at) : null;
      if (submittedDate && submittedDate >= thirtyDaysAgo) {
        orgClaims.submitted++;
      }

      if (claim.status === ClaimStatus.PAID || claim.status === ClaimStatus.PARTIAL_PAYMENT) {
        orgClaims.paid++;
      }
      if (claim.status === ClaimStatus.DENIED) {
        orgClaims.denied++;
      }
    }

    return orgs.payload.map((org) => {
      const activeUsers = usersByOrg.get(org.id) ?? 0;
      const orgClaims = claimsByOrg.get(org.id) ?? { submitted: 0, paid: 0, denied: 0 };
      const decided = orgClaims.paid + orgClaims.denied;
      const successRate = decided > 0
        ? Math.round((orgClaims.paid / decided) * 10000) / 100
        : 100;

      let health_score: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
      if (successRate > 80) {
        health_score = 'HEALTHY';
      } else if (successRate >= 50) {
        health_score = 'AT_RISK';
      } else {
        health_score = 'CRITICAL';
      }

      return {
        org_id: org.id,
        legal_name: org.legal_name,
        plan_tier: org.plan_tier ?? 'unknown',
        active_users: activeUsers,
        claims_submitted_30d: orgClaims.submitted,
        claim_success_rate_percent: successRate,
        health_score,
      };
    });
  }
}
