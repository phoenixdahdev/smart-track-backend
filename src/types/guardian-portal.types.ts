import { type GuardianRelationship } from '@enums/guardian-relationship.enum';
import { type AssistanceLevel } from '@enums/assistance-level.enum';

export interface RedactedIndividualSummary {
  id: string;
  first_name: string;
  last_name: string;
  active: boolean;
  relationship: GuardianRelationship;
}

export interface RedactedIndividualProfile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  active: boolean;
}

export interface RedactedServiceRecordSummary {
  id: string;
  service_date: string;
  units_delivered: number;
  status: string;
  program_id: string | null;
  has_daily_notes: boolean;
}

export interface RedactedIncidentSummary {
  id: string;
  type: string;
  occurred_at: Date;
  status: string;
}

export interface RedactedIspGoalSummary {
  id: string;
  description: string;
  target: string | null;
  effective_start: string;
  effective_end: string | null;
  active: boolean;
  data_point_count: number;
}

export interface RedactedIspDataPoint {
  id: string;
  value: string;
  recorded_at: Date;
}

export interface RedactedShiftSummary {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface RedactedMarSummary {
  id: string;
  drug_name: string;
  scheduled_time: Date;
  administered_time: Date | null;
  result: string;
}

export interface RedactedAdlSummary {
  id: string;
  category_name: string;
  assistance_level: AssistanceLevel;
  recorded_at: Date;
}

export interface GuardianDashboardData {
  individual_id: string;
  individual_name: string;
  recent_service_count: number;
  upcoming_shift_count: number;
  active_isp_goals: number;
  recent_incident_count: number;
  unread_notification_count: number;
}
