import { type ClaimStatus } from '@enums/claim-status.enum';
import { type ServiceRecordStatus } from '@enums/service-record-status.enum';
import { type AuthorizationStatus } from '@enums/authorization-status.enum';

// --- Claims Lifecycle ---

export type ClaimStatusCount = {
  status: ClaimStatus;
  count: number;
  total_charge_cents: number;
};

export type DenialReasonAnalysis = {
  reason_code: string;
  count: number;
  total_charge_cents: number;
  percentage: number;
};

export type ClaimsLifecycleReport = {
  by_status: ClaimStatusCount[];
  total_claims: number;
  avg_days_draft_to_submitted: number;
  avg_days_submitted_to_paid: number;
  avg_days_submitted_to_denied: number;
  denial_analysis: DenialReasonAnalysis[];
};

// --- Documentation Compliance ---

export type ServiceRecordStatusCount = {
  status: ServiceRecordStatus;
  count: number;
};

export type DocumentationComplianceReport = {
  total_records: number;
  by_status: ServiceRecordStatusCount[];
  approval_rate_percent: number;
  rejection_rate_percent: number;
  avg_hours_to_review: number;
  records_with_daily_notes: number;
  records_without_daily_notes: number;
  documentation_completeness_percent: number;
};

// --- EVV Compliance ---

export type EvvComplianceReport = {
  total_punches: number;
  clock_in_count: number;
  clock_out_count: number;
  gps_confirmed_count: number;
  gps_confirmation_rate_percent: number;
  missed_punch_count: number;
  correction_count: number;
  corrections_approved: number;
  corrections_rejected: number;
  corrections_pending: number;
};

// --- Staff Utilization ---

export type StaffUtilizationRow = {
  staff_id: string;
  staff_name: string;
  hours_logged: number;
  units_delivered: number;
  shifts_scheduled: number;
  shifts_completed: number;
  shift_fulfillment_rate_percent: number;
  service_records_submitted: number;
};

export type StaffUtilizationReport = {
  staff: StaffUtilizationRow[];
  total_hours_logged: number;
  total_units_delivered: number;
  avg_hours_per_staff: number;
};

// --- Authorization Usage ---

export type AuthorizationUsageRow = {
  authorization_id: string;
  auth_number: string;
  individual_id: string;
  service_code_id: string;
  payer_config_id: string;
  units_authorized: number;
  units_used: number;
  units_pending: number;
  units_remaining: number;
  utilization_percent: number;
  start_date: string;
  end_date: string;
  days_until_expiry: number;
  status: AuthorizationStatus;
};

export type AuthorizationUsageReport = {
  authorizations: AuthorizationUsageRow[];
  approaching_threshold: number;
  exceeded: number;
  expiring_soon: number;
};

// --- Platform Analytics ---

export type MrrByTier = {
  tier: string;
  count: number;
  mrr_cents: number;
};

export type AgencyHealthScore = {
  org_id: string;
  legal_name: string;
  plan_tier: string;
  active_users: number;
  claims_submitted_30d: number;
  claim_success_rate_percent: number;
  health_score: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
};

export type PlatformAnalyticsReport = {
  total_agencies: number;
  active_agencies: number;
  total_mrr_cents: number;
  mrr_by_tier: MrrByTier[];
  agencies_by_status: Record<string, number>;
  claims_by_status_platform: Record<string, number>;
  avg_claims_per_agency: number;
  agency_health_scores: AgencyHealthScore[];
};
