export enum ServiceRecordStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const SERVICE_RECORD_TRANSITIONS: Record<
  ServiceRecordStatus,
  ServiceRecordStatus[]
> = {
  [ServiceRecordStatus.DRAFT]: [ServiceRecordStatus.PENDING_REVIEW],
  [ServiceRecordStatus.PENDING_REVIEW]: [
    ServiceRecordStatus.APPROVED,
    ServiceRecordStatus.REJECTED,
  ],
  [ServiceRecordStatus.APPROVED]: [],
  [ServiceRecordStatus.REJECTED]: [ServiceRecordStatus.DRAFT],
};
