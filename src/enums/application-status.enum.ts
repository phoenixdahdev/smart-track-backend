export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DOCS_REQUESTED = 'DOCS_REQUESTED',
  DOCS_RECEIVED = 'DOCS_RECEIVED',
  APPROVED = 'APPROVED',
  PROVISIONING = 'PROVISIONING',
  ONBOARDING = 'ONBOARDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
}

export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.SUBMITTED]: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED],
  [ApplicationStatus.UNDER_REVIEW]: [ApplicationStatus.DOCS_REQUESTED, ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
  [ApplicationStatus.DOCS_REQUESTED]: [ApplicationStatus.DOCS_RECEIVED, ApplicationStatus.REJECTED],
  [ApplicationStatus.DOCS_RECEIVED]: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED],
  [ApplicationStatus.APPROVED]: [ApplicationStatus.PROVISIONING],
  [ApplicationStatus.PROVISIONING]: [ApplicationStatus.ONBOARDING],
  [ApplicationStatus.ONBOARDING]: [ApplicationStatus.ACTIVE],
  [ApplicationStatus.ACTIVE]: [],
  [ApplicationStatus.REJECTED]: [],
};
