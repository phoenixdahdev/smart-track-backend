import { Injectable } from '@nestjs/common';
import { ClaimDal } from '@dals/claim.dal';
import { ClaimStatus } from '@enums/claim-status.enum';
import {
  type ClaimsLifecycleReport,
  type ClaimStatusCount,
  type DenialReasonAnalysis,
} from '@app-types/reporting.types';
import { MAX_ANALYTICS_RECORDS } from '@utils/analytics-constants';

const EXCLUDED_STATUSES = new Set([ClaimStatus.VOID, ClaimStatus.DRAFT]);

@Injectable()
export class ClaimsAnalyticsService {
  constructor(private readonly claimDal: ClaimDal) {}

  async getClaimsLifecycle(
    orgId: string,
    filters?: { date_from?: string; date_to?: string; payer_config_id?: string; individual_id?: string },
  ): Promise<ClaimsLifecycleReport> {
    const findOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.payer_config_id) findOptions.payer_config_id = filters.payer_config_id;
    if (filters?.individual_id) findOptions.individual_id = filters.individual_id;

    const claims = await this.claimDal.find({
      findOptions: findOptions as never,
      paginationPayload: { limit: MAX_ANALYTICS_RECORDS, page: 1 },
      transactionOptions: { useTransaction: false },
    });

    const statusMap = new Map<ClaimStatus, ClaimStatusCount>();
    let totalClaims = 0;
    let draftToSubmittedSum = 0;
    let draftToSubmittedCount = 0;
    let submittedToPaidSum = 0;
    let submittedToPaidCount = 0;
    let submittedToDeniedSum = 0;
    let submittedToDeniedCount = 0;
    const denialCodes = new Map<string, { count: number; total_charge_cents: number }>();

    for (const claim of claims.payload) {
      if (EXCLUDED_STATUSES.has(claim.status)) continue;

      if (filters?.date_from) {
        const dateRef = claim.submitted_at
          ? new Date(claim.submitted_at).toISOString().split('T')[0]
          : claim.service_date_from;
        if (dateRef < filters.date_from) continue;
      }
      if (filters?.date_to) {
        const dateRef = claim.submitted_at
          ? new Date(claim.submitted_at).toISOString().split('T')[0]
          : claim.service_date_from;
        if (dateRef > filters.date_to) continue;
      }

      totalClaims++;

      // Count by status
      if (!statusMap.has(claim.status)) {
        statusMap.set(claim.status, { status: claim.status, count: 0, total_charge_cents: 0 });
      }
      const sc = statusMap.get(claim.status)!;
      sc.count++;
      sc.total_charge_cents += Number(claim.total_charge_cents);

      // Avg days draft→submitted
      if (claim.submitted_at && claim.created_at) {
        const days = Math.floor(
          (new Date(claim.submitted_at).getTime() - new Date(claim.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        draftToSubmittedSum += days;
        draftToSubmittedCount++;
      }

      // Avg days submitted→paid
      if (claim.paid_at && claim.submitted_at) {
        const days = Math.floor(
          (new Date(claim.paid_at).getTime() - new Date(claim.submitted_at).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        submittedToPaidSum += days;
        submittedToPaidCount++;
      }

      // Avg days submitted→denied
      if (claim.status === ClaimStatus.DENIED && claim.submitted_at && claim.updated_at) {
        const days = Math.floor(
          (new Date(claim.updated_at).getTime() - new Date(claim.submitted_at).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        submittedToDeniedSum += days;
        submittedToDeniedCount++;
      }

      // Denial reason codes
      if (
        claim.status === ClaimStatus.DENIED &&
        Array.isArray(claim.denial_reason_codes) &&
        claim.denial_reason_codes.length > 0
      ) {
        for (const code of claim.denial_reason_codes) {
          if (!denialCodes.has(code)) {
            denialCodes.set(code, { count: 0, total_charge_cents: 0 });
          }
          const dc = denialCodes.get(code)!;
          dc.count++;
          dc.total_charge_cents += Number(claim.total_charge_cents);
        }
      }
    }

    const totalDenied = denialCodes.size > 0
      ? Array.from(denialCodes.values()).reduce((s, d) => s + d.count, 0)
      : 0;

    const denial_analysis: DenialReasonAnalysis[] = Array.from(denialCodes.entries())
      .map(([reason_code, data]) => ({
        reason_code,
        count: data.count,
        total_charge_cents: data.total_charge_cents,
        percentage: totalDenied > 0
          ? Math.round((data.count / totalDenied) * 10000) / 100
          : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      by_status: Array.from(statusMap.values()),
      total_claims: totalClaims,
      avg_days_draft_to_submitted: draftToSubmittedCount > 0
        ? Math.round(draftToSubmittedSum / draftToSubmittedCount)
        : 0,
      avg_days_submitted_to_paid: submittedToPaidCount > 0
        ? Math.round(submittedToPaidSum / submittedToPaidCount)
        : 0,
      avg_days_submitted_to_denied: submittedToDeniedCount > 0
        ? Math.round(submittedToDeniedSum / submittedToDeniedCount)
        : 0,
      denial_analysis,
    };
  }

  async getDenialAnalysis(
    orgId: string,
    filters?: { date_from?: string; date_to?: string; payer_config_id?: string; individual_id?: string },
  ): Promise<DenialReasonAnalysis[]> {
    const report = await this.getClaimsLifecycle(orgId, filters);
    return report.denial_analysis;
  }
}
