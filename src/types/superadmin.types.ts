import { type ApplicationStatus } from '@enums/application-status.enum';

export type RiskScore = {
  score: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];
};

export type ProvisioningManifest = {
  application_id: string;
  org_id: string;
  admin_user_id: string;
  subscription_id: string;
  checklist_id: string;
  modules_enabled: string[];
};

export type PlatformDashboardData = {
  active_agencies: number;
  pending_applications: number;
  active_subscriptions: number;
  total_mrr_cents: number;
  agencies_by_status: Record<string, number>;
  applications_by_status: Record<string, number>;
};

export type ApplicationSummaryCounts = Record<ApplicationStatus, number>;
