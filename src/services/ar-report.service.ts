import { Injectable } from '@nestjs/common';
import { ClaimDal } from '@dals/claim.dal';
import { RemittanceDal } from '@dals/remittance.dal';
import { PaymentPostDal } from '@dals/payment-post.dal';
import { AdjustmentDal } from '@dals/adjustment.dal';
import { ClaimStatus } from '@enums/claim-status.enum';
import {
  type ArAgingReport,
  type ArAgingBucket,
  type EftReconciliationReport,
  type EftReconciliationRow,
  type FinancialDashboardData,
  type PayerPerformanceData,
  type PayerPerformanceRow,
} from '@app-types/era.types';

const AGING_BUCKETS = [
  { label: '0-30', min: 0, max: 30 },
  { label: '31-60', min: 31, max: 60 },
  { label: '61-90', min: 61, max: 90 },
  { label: '91-120', min: 91, max: 120 },
  { label: '120+', min: 121, max: Infinity },
];

const EXCLUDED_STATUSES = new Set([
  ClaimStatus.VOID,
  ClaimStatus.DRAFT,
]);

@Injectable()
export class ArReportService {
  constructor(
    private readonly claimDal: ClaimDal,
    private readonly remittanceDal: RemittanceDal,
    private readonly paymentPostDal: PaymentPostDal,
    private readonly adjustmentDal: AdjustmentDal,
  ) {}

  async getArAgingReport(
    orgId: string,
    filters?: { payer_config_id?: string; individual_id?: string; as_of_date?: string },
  ): Promise<ArAgingReport> {
    const asOf = filters?.as_of_date
      ? new Date(filters.as_of_date)
      : new Date();

    const findOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.payer_config_id) findOptions.payer_config_id = filters.payer_config_id;
    if (filters?.individual_id) findOptions.individual_id = filters.individual_id;

    const claims = await this.claimDal.find({
      findOptions: findOptions as never,
      transactionOptions: { useTransaction: false },
    });

    const buckets: ArAgingBucket[] = AGING_BUCKETS.map((b) => ({
      bucket: b.label,
      count: 0,
      total_cents: 0,
    }));

    let totalOutstanding = 0;
    let totalClaims = 0;

    for (const claim of claims.payload) {
      if (EXCLUDED_STATUSES.has(claim.status)) continue;
      if (Number(claim.balance_cents) <= 0) continue;

      const submittedDate = claim.submitted_at
        ? new Date(claim.submitted_at)
        : new Date(claim.created_at);
      const daysOut = Math.floor(
        (asOf.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      for (let i = 0; i < AGING_BUCKETS.length; i++) {
        if (daysOut >= AGING_BUCKETS[i].min && daysOut <= AGING_BUCKETS[i].max) {
          buckets[i].count++;
          buckets[i].total_cents += Number(claim.balance_cents);
          break;
        }
      }

      totalOutstanding += Number(claim.balance_cents);
      totalClaims++;
    }

    return { buckets, total_outstanding_cents: totalOutstanding, total_claims: totalClaims };
  }

  async getEftReconciliation(
    orgId: string,
    filters?: { date_from?: string; date_to?: string; payer_config_id?: string },
  ): Promise<EftReconciliationReport> {
    const findOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.payer_config_id) findOptions.payer_config_id = filters.payer_config_id;

    const remittances = await this.remittanceDal.find({
      findOptions: findOptions as never,
      transactionOptions: { useTransaction: false },
    });

    const rows: EftReconciliationRow[] = [];
    let totalEft = 0;
    let totalPosted = 0;

    for (const rem of remittances.payload) {
      if (filters?.date_from && rem.payment_date < filters.date_from) continue;
      if (filters?.date_to && rem.payment_date > filters.date_to) continue;

      const posts = await this.paymentPostDal.find({
        findOptions: { org_id: orgId, remittance_id: rem.id } as never,
        transactionOptions: { useTransaction: false },
      });

      const postedCents = posts.payload.reduce(
        (sum, p) => sum + Number(p.paid_cents),
        0,
      );
      const eftCents = Number(rem.eft_total_cents);
      const variance = eftCents - postedCents;

      rows.push({
        remittance_id: rem.id,
        eft_trace_number: rem.eft_trace_number,
        payment_date: rem.payment_date,
        eft_total_cents: eftCents,
        posted_total_cents: postedCents,
        variance_cents: variance,
        status: rem.status,
      });

      totalEft += eftCents;
      totalPosted += postedCents;
    }

    return {
      rows,
      total_eft_cents: totalEft,
      total_posted_cents: totalPosted,
      total_variance_cents: totalEft - totalPosted,
    };
  }

  async getFinancialDashboard(
    orgId: string,
    filters?: { date_from?: string; date_to?: string },
  ): Promise<FinancialDashboardData> {
    const findOptions: Record<string, unknown> = { org_id: orgId };

    const claims = await this.claimDal.find({
      findOptions: findOptions as never,
      transactionOptions: { useTransaction: false },
    });

    let totalBilled = 0;
    let totalPaid = 0;
    let totalAdj = 0;
    let totalOutstanding = 0;
    let daysSum = 0;
    let paidCount = 0;

    for (const claim of claims.payload) {
      if (EXCLUDED_STATUSES.has(claim.status)) continue;

      if (filters?.date_from) {
        const submitted = claim.submitted_at
          ? new Date(claim.submitted_at).toISOString().split('T')[0]
          : claim.service_date_from;
        if (submitted < filters.date_from) continue;
      }
      if (filters?.date_to) {
        const submitted = claim.submitted_at
          ? new Date(claim.submitted_at).toISOString().split('T')[0]
          : claim.service_date_from;
        if (submitted > filters.date_to) continue;
      }

      totalBilled += Number(claim.total_charge_cents);
      totalPaid += Number(claim.paid_amount_cents);
      totalAdj += Number(claim.contractual_adj_cents);
      totalOutstanding += Number(claim.balance_cents);

      if (claim.paid_at && claim.submitted_at) {
        const days = Math.floor(
          (new Date(claim.paid_at).getTime() -
            new Date(claim.submitted_at).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        daysSum += days;
        paidCount++;
      }
    }

    const collectionRate =
      totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
    const avgDays = paidCount > 0 ? Math.round(daysSum / paidCount) : 0;

    return {
      total_billed_cents: totalBilled,
      total_paid_cents: totalPaid,
      total_adjustments_cents: totalAdj,
      total_outstanding_cents: totalOutstanding,
      collection_rate_percent: Math.round(collectionRate * 100) / 100,
      avg_days_to_payment: avgDays,
    };
  }

  async getPayerPerformance(
    orgId: string,
    filters?: { date_from?: string; date_to?: string },
  ): Promise<PayerPerformanceData> {
    const findOptions: Record<string, unknown> = { org_id: orgId };

    const claims = await this.claimDal.find({
      findOptions: findOptions as never,
      transactionOptions: { useTransaction: false },
    });

    const payerMap = new Map<string, PayerPerformanceRow>();

    for (const claim of claims.payload) {
      if (EXCLUDED_STATUSES.has(claim.status)) continue;

      if (filters?.date_from) {
        const submitted = claim.submitted_at
          ? new Date(claim.submitted_at).toISOString().split('T')[0]
          : claim.service_date_from;
        if (submitted < filters.date_from) continue;
      }
      if (filters?.date_to) {
        const submitted = claim.submitted_at
          ? new Date(claim.submitted_at).toISOString().split('T')[0]
          : claim.service_date_from;
        if (submitted > filters.date_to) continue;
      }

      const key = claim.payer_config_id;
      if (!payerMap.has(key)) {
        payerMap.set(key, {
          payer_config_id: key,
          submitted_count: 0,
          paid_count: 0,
          denied_count: 0,
          submitted_cents: 0,
          paid_cents: 0,
          denied_cents: 0,
          denial_rate_percent: 0,
          avg_days_to_payment: 0,
        });
      }

      const row = payerMap.get(key)!;
      row.submitted_count++;
      row.submitted_cents += Number(claim.total_charge_cents);

      if (claim.status === ClaimStatus.PAID || claim.status === ClaimStatus.PARTIAL_PAYMENT) {
        row.paid_count++;
        row.paid_cents += Number(claim.paid_amount_cents);
      }

      if (claim.status === ClaimStatus.DENIED) {
        row.denied_count++;
        row.denied_cents += Number(claim.total_charge_cents);
      }
    }

    const payers = Array.from(payerMap.values()).map((row) => {
      row.denial_rate_percent =
        row.submitted_count > 0
          ? Math.round((row.denied_count / row.submitted_count) * 10000) / 100
          : 0;
      return row;
    });

    return { payers };
  }
}
