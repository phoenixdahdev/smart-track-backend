export enum ShiftStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  NO_RESPONSE = 'NO_RESPONSE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const SHIFT_TRANSITIONS: Record<ShiftStatus, ShiftStatus[]> = {
  [ShiftStatus.DRAFT]: [ShiftStatus.PUBLISHED, ShiftStatus.CANCELLED],
  [ShiftStatus.PUBLISHED]: [
    ShiftStatus.ACCEPTED,
    ShiftStatus.REJECTED,
    ShiftStatus.NO_RESPONSE,
    ShiftStatus.CANCELLED,
  ],
  [ShiftStatus.ACCEPTED]: [ShiftStatus.IN_PROGRESS, ShiftStatus.CANCELLED],
  [ShiftStatus.NO_RESPONSE]: [ShiftStatus.PUBLISHED, ShiftStatus.CANCELLED],
  [ShiftStatus.IN_PROGRESS]: [ShiftStatus.COMPLETED, ShiftStatus.CANCELLED],
  [ShiftStatus.REJECTED]: [],
  [ShiftStatus.COMPLETED]: [],
  [ShiftStatus.CANCELLED]: [],
};
