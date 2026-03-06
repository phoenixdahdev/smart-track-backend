export enum ClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED_277 = 'ACCEPTED_277',
  REJECTED_277 = 'REJECTED_277',
  PENDING = 'PENDING',
  PAID = 'PAID',
  DENIED = 'DENIED',
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
  ADJUSTED = 'ADJUSTED',
  VOID = 'VOID',
  APPEALED = 'APPEALED',
}

export const CLAIM_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  [ClaimStatus.DRAFT]: [ClaimStatus.SUBMITTED],
  [ClaimStatus.SUBMITTED]: [ClaimStatus.ACCEPTED_277, ClaimStatus.REJECTED_277],
  [ClaimStatus.ACCEPTED_277]: [ClaimStatus.PENDING],
  [ClaimStatus.REJECTED_277]: [ClaimStatus.DRAFT],
  [ClaimStatus.PENDING]: [
    ClaimStatus.PAID,
    ClaimStatus.DENIED,
    ClaimStatus.PARTIAL_PAYMENT,
    ClaimStatus.ADJUSTED,
  ],
  [ClaimStatus.PAID]: [ClaimStatus.ADJUSTED, ClaimStatus.VOID],
  [ClaimStatus.DENIED]: [ClaimStatus.APPEALED, ClaimStatus.VOID],
  [ClaimStatus.PARTIAL_PAYMENT]: [
    ClaimStatus.APPEALED,
    ClaimStatus.ADJUSTED,
    ClaimStatus.VOID,
  ],
  [ClaimStatus.ADJUSTED]: [ClaimStatus.VOID],
  [ClaimStatus.VOID]: [],
  [ClaimStatus.APPEALED]: [
    ClaimStatus.PAID,
    ClaimStatus.DENIED,
    ClaimStatus.PARTIAL_PAYMENT,
  ],
};
