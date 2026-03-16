import { type MatchingMethod } from '@enums/matching-method.enum';
import { type AdjustmentType } from '@enums/adjustment-type.enum';
import { type RemittanceStatus } from '@enums/remittance-status.enum';

export type EraClaimPaymentAdjustment = {
  group_code: string;
  reason_code: string;
  amount_cents: number;
};

export type EraClaimPayment = {
  claim_id?: string;
  payer_claim_control_number?: string;
  subscriber_id?: string;
  service_date_from?: string;
  service_date_through?: string;
  billed_cents: number;
  paid_cents: number;
  patient_responsibility_cents?: number;
  status_code?: string;
  adjustments?: EraClaimPaymentAdjustment[];
};

export type EraPayload = {
  payer_config_id: string;
  payment_date: string;
  eft_trace_number: string;
  eft_total_cents: number;
  interchange_control_num?: string;
  claim_payments: EraClaimPayment[];
};

export type MatchResult = {
  claim_id: string;
  method: MatchingMethod;
  confidence: number;
};

export type ArAgingBucket = {
  bucket: string;
  count: number;
  total_cents: number;
};

export type ArAgingReport = {
  buckets: ArAgingBucket[];
  total_outstanding_cents: number;
  total_claims: number;
};

export type EftReconciliationRow = {
  remittance_id: string;
  eft_trace_number: string;
  payment_date: string;
  eft_total_cents: number;
  posted_total_cents: number;
  variance_cents: number;
  status: RemittanceStatus;
};

export type EftReconciliationReport = {
  rows: EftReconciliationRow[];
  total_eft_cents: number;
  total_posted_cents: number;
  total_variance_cents: number;
};

export type FinancialDashboardData = {
  total_billed_cents: number;
  total_paid_cents: number;
  total_adjustments_cents: number;
  total_outstanding_cents: number;
  collection_rate_percent: number;
  avg_days_to_payment: number;
};

export type PayerPerformanceRow = {
  payer_config_id: string;
  submitted_count: number;
  paid_count: number;
  denied_count: number;
  submitted_cents: number;
  paid_cents: number;
  denied_cents: number;
  denial_rate_percent: number;
  avg_days_to_payment: number;
};

export type PayerPerformanceData = {
  payers: PayerPerformanceRow[];
};

export type CasGroupToAdjustmentType = Record<string, AdjustmentType>;
