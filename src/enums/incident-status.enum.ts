export enum IncidentStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CLOSED = 'CLOSED',
}

export const INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  [IncidentStatus.DRAFT]: [IncidentStatus.SUBMITTED],
  [IncidentStatus.SUBMITTED]: [IncidentStatus.UNDER_REVIEW],
  [IncidentStatus.UNDER_REVIEW]: [IncidentStatus.CLOSED],
  [IncidentStatus.CLOSED]: [],
};
