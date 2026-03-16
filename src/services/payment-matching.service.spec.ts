import { NotFoundException } from '@nestjs/common';
import { PaymentMatchingService } from './payment-matching.service';
import { MatchingMethod } from '@enums/matching-method.enum';

describe('PaymentMatchingService', () => {
  let service: PaymentMatchingService;
  let claimDal: { get: jest.Mock; find: jest.Mock };
  let paymentPostDal: { get: jest.Mock; find: jest.Mock; update: jest.Mock };
  let individualPayerCoverageDal: { find: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockClaim = {
    id: 'claim-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    payer_claim_control_number: 'PCN-001',
    service_date_from: '2026-03-10',
    service_date_through: '2026-03-10',
  };

  const mockPost = {
    id: 'post-uuid',
    org_id: 'org-uuid',
    remittance_id: 'rem-uuid',
    claim_id: null,
    billed_cents: 10000,
    paid_cents: 8000,
  };

  const mockCoverage = {
    id: 'cov-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    subscriber_id: 'SUB-123',
  };

  beforeEach(() => {
    claimDal = {
      get: jest.fn().mockResolvedValue(mockClaim),
      find: jest.fn().mockResolvedValue({ payload: [mockClaim] }),
    };
    paymentPostDal = {
      get: jest.fn().mockResolvedValue(mockPost),
      find: jest.fn().mockResolvedValue({
        payload: [mockPost],
        paginationMeta: { total: 1 },
      }),
      update: jest.fn().mockResolvedValue({ ...mockPost, claim_id: 'claim-uuid' }),
    };
    individualPayerCoverageDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockCoverage] }),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new PaymentMatchingService(
      claimDal as never,
      paymentPostDal as never,
      individualPayerCoverageDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('matchPaymentPost', () => {
    it('should match by CLAIM_ID with confidence 1.00', async () => {
      const result = await service.matchPaymentPost(
        { claim_id: 'claim-uuid', billed_cents: 10000, paid_cents: 8000 },
        'org-uuid',
      );

      expect(result).toEqual({
        claim_id: 'claim-uuid',
        method: MatchingMethod.CLAIM_ID,
        confidence: 1.0,
      });
    });

    it('should return null when claim_id does not exist', async () => {
      claimDal.get.mockResolvedValue(null);

      const result = await service.matchPaymentPost(
        { claim_id: 'bad-uuid', billed_cents: 10000, paid_cents: 8000 },
        'org-uuid',
      );

      expect(result).toBeNull();
    });

    it('should match by PAYER_CONTROL_NUM with confidence 0.95', async () => {
      const result = await service.matchPaymentPost(
        { payer_claim_control_number: 'PCN-001', billed_cents: 10000, paid_cents: 8000 },
        'org-uuid',
      );

      expect(result).toEqual({
        claim_id: 'claim-uuid',
        method: MatchingMethod.PAYER_CONTROL_NUM,
        confidence: 0.95,
      });
    });

    it('should not match by PAYER_CONTROL_NUM when multiple claims found', async () => {
      claimDal.find.mockResolvedValue({
        payload: [mockClaim, { ...mockClaim, id: 'claim-uuid-2' }],
      });

      const result = await service.matchPaymentPost(
        { payer_claim_control_number: 'PCN-001', billed_cents: 10000, paid_cents: 8000 },
        'org-uuid',
      );

      expect(result).toBeNull();
    });

    it('should match by SERVICE_DATE_MEMBER with confidence 0.80', async () => {
      claimDal.get.mockResolvedValue(null); // No claim_id match
      claimDal.find.mockResolvedValueOnce({ payload: [mockClaim] }); // Coverage find
      // Note: no payer_claim_control_number in input, so PCN path is skipped

      const result = await service.matchPaymentPost(
        {
          subscriber_id: 'SUB-123',
          service_date_from: '2026-03-10',
          service_date_through: '2026-03-10',
          billed_cents: 10000,
          paid_cents: 8000,
        },
        'org-uuid',
      );

      expect(result).toEqual({
        claim_id: 'claim-uuid',
        method: MatchingMethod.SERVICE_DATE_MEMBER,
        confidence: 0.8,
      });
    });

    it('should return null when no match found', async () => {
      const result = await service.matchPaymentPost(
        { billed_cents: 10000, paid_cents: 8000 },
        'org-uuid',
      );

      expect(result).toBeNull();
    });
  });

  describe('manualMatch', () => {
    it('should manually match a post to a claim', async () => {
      const result = await service.manualMatch(
        'post-uuid', 'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(paymentPostDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            claim_id: 'claim-uuid',
            matching_method: MatchingMethod.MANUAL,
            matching_confidence: 1.0,
          }) as unknown,
        }),
      );
      expect(result.claim_id).toBe('claim-uuid');
    });

    it('should throw NotFoundException when post not found', async () => {
      paymentPostDal.get.mockResolvedValue(null);

      await expect(
        service.manualMatch('bad-id', 'claim-uuid', 'org-uuid', 'u', 'r', '127.0.0.1', 'j'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when claim not found', async () => {
      claimDal.get.mockResolvedValue(null);

      await expect(
        service.manualMatch('post-uuid', 'bad-id', 'org-uuid', 'u', 'r', '127.0.0.1', 'j'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit action', async () => {
      await service.manualMatch(
        'post-uuid', 'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYMENT_POST_MANUAL_MATCH',
          record_id: 'post-uuid',
        }),
      );
    });
  });

  describe('unmatch', () => {
    it('should clear match fields on a post', async () => {
      await service.unmatch('post-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest');

      expect(paymentPostDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            claim_id: null,
            matching_method: null,
            matching_confidence: null,
          }) as unknown,
        }),
      );
    });

    it('should throw NotFoundException when post not found', async () => {
      paymentPostDal.get.mockResolvedValue(null);

      await expect(
        service.unmatch('bad-id', 'org-uuid', 'u', 'r', '127.0.0.1', 'j'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit action', async () => {
      await service.unmatch('post-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYMENT_POST_UNMATCHED',
          record_id: 'post-uuid',
        }),
      );
    });
  });

  describe('listUnmatched', () => {
    it('should return unmatched payment posts', async () => {
      const result = await service.listUnmatched('org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(paymentPostDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { page: 1, limit: 20 },
        }),
      );
    });

    it('should apply pagination', async () => {
      await service.listUnmatched('org-uuid', { page: '2', limit: '10' } as never);

      expect(paymentPostDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { page: 2, limit: 10 },
        }),
      );
    });
  });
});
