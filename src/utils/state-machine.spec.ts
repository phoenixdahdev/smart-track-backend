import { validateTransition } from './state-machine';
import {
  ServiceRecordStatus,
  SERVICE_RECORD_TRANSITIONS,
} from '@enums/service-record-status.enum';
import { ClaimStatus, CLAIM_TRANSITIONS } from '@enums/claim-status.enum';

describe('validateTransition', () => {
  describe('service record transitions', () => {
    it('should allow DRAFT -> PENDING_REVIEW', () => {
      expect(
        validateTransition(
          SERVICE_RECORD_TRANSITIONS,
          ServiceRecordStatus.DRAFT,
          ServiceRecordStatus.PENDING_REVIEW,
        ),
      ).toBe(true);
    });

    it('should allow PENDING_REVIEW -> APPROVED', () => {
      expect(
        validateTransition(
          SERVICE_RECORD_TRANSITIONS,
          ServiceRecordStatus.PENDING_REVIEW,
          ServiceRecordStatus.APPROVED,
        ),
      ).toBe(true);
    });

    it('should allow PENDING_REVIEW -> REJECTED', () => {
      expect(
        validateTransition(
          SERVICE_RECORD_TRANSITIONS,
          ServiceRecordStatus.PENDING_REVIEW,
          ServiceRecordStatus.REJECTED,
        ),
      ).toBe(true);
    });

    it('should allow REJECTED -> DRAFT (resubmission)', () => {
      expect(
        validateTransition(
          SERVICE_RECORD_TRANSITIONS,
          ServiceRecordStatus.REJECTED,
          ServiceRecordStatus.DRAFT,
        ),
      ).toBe(true);
    });

    it('should NOT allow DRAFT -> APPROVED (skip state)', () => {
      expect(
        validateTransition(
          SERVICE_RECORD_TRANSITIONS,
          ServiceRecordStatus.DRAFT,
          ServiceRecordStatus.APPROVED,
        ),
      ).toBe(false);
    });

    it('should NOT allow APPROVED -> any state (immutable)', () => {
      expect(
        validateTransition(
          SERVICE_RECORD_TRANSITIONS,
          ServiceRecordStatus.APPROVED,
          ServiceRecordStatus.DRAFT,
        ),
      ).toBe(false);
      expect(
        validateTransition(
          SERVICE_RECORD_TRANSITIONS,
          ServiceRecordStatus.APPROVED,
          ServiceRecordStatus.PENDING_REVIEW,
        ),
      ).toBe(false);
      expect(
        validateTransition(
          SERVICE_RECORD_TRANSITIONS,
          ServiceRecordStatus.APPROVED,
          ServiceRecordStatus.REJECTED,
        ),
      ).toBe(false);
    });

    it('should NOT allow DRAFT -> REJECTED (only supervisor can reject)', () => {
      expect(
        validateTransition(
          SERVICE_RECORD_TRANSITIONS,
          ServiceRecordStatus.DRAFT,
          ServiceRecordStatus.REJECTED,
        ),
      ).toBe(false);
    });
  });

  describe('claim transitions', () => {
    it('should allow DRAFT -> SUBMITTED', () => {
      expect(
        validateTransition(CLAIM_TRANSITIONS, ClaimStatus.DRAFT, ClaimStatus.SUBMITTED),
      ).toBe(true);
    });

    it('should allow SUBMITTED -> ACCEPTED_277', () => {
      expect(
        validateTransition(
          CLAIM_TRANSITIONS,
          ClaimStatus.SUBMITTED,
          ClaimStatus.ACCEPTED_277,
        ),
      ).toBe(true);
    });

    it('should allow PENDING -> PAID', () => {
      expect(
        validateTransition(CLAIM_TRANSITIONS, ClaimStatus.PENDING, ClaimStatus.PAID),
      ).toBe(true);
    });

    it('should allow DENIED -> APPEALED', () => {
      expect(
        validateTransition(CLAIM_TRANSITIONS, ClaimStatus.DENIED, ClaimStatus.APPEALED),
      ).toBe(true);
    });

    it('should NOT allow DRAFT -> PAID (skip states)', () => {
      expect(
        validateTransition(CLAIM_TRANSITIONS, ClaimStatus.DRAFT, ClaimStatus.PAID),
      ).toBe(false);
    });

    it('should NOT allow VOID -> any state (terminal)', () => {
      expect(
        validateTransition(CLAIM_TRANSITIONS, ClaimStatus.VOID, ClaimStatus.DRAFT),
      ).toBe(false);
      expect(
        validateTransition(CLAIM_TRANSITIONS, ClaimStatus.VOID, ClaimStatus.PAID),
      ).toBe(false);
    });

    it('should allow REJECTED_277 -> DRAFT (can resubmit)', () => {
      expect(
        validateTransition(
          CLAIM_TRANSITIONS,
          ClaimStatus.REJECTED_277,
          ClaimStatus.DRAFT,
        ),
      ).toBe(true);
    });
  });
});
