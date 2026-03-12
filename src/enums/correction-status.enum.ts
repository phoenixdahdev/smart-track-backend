export enum CorrectionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const CORRECTION_TRANSITIONS: Record<
  CorrectionStatus,
  CorrectionStatus[]
> = {
  [CorrectionStatus.PENDING]: [
    CorrectionStatus.APPROVED,
    CorrectionStatus.REJECTED,
  ],
  [CorrectionStatus.APPROVED]: [],
  [CorrectionStatus.REJECTED]: [],
};
