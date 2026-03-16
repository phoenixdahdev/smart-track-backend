import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentPostingService } from './payment-posting.service';
import { AdjustmentType } from '@enums/adjustment-type.enum';
import { ClaimStatus } from '@enums/claim-status.enum';

describe('PaymentPostingService', () => {
  let service: PaymentPostingService;
  let paymentPostDal: { get: jest.Mock; find: jest.Mock; update: jest.Mock; create: jest.Mock };
  let adjustmentDal: { find: jest.Mock; create: jest.Mock };
  let claimDal: { get: jest.Mock; find: jest.Mock; update: jest.Mock };
  let claimLineDal: { find: jest.Mock };
  let claimStatusHistoryDal: { create: jest.Mock };
  let serviceAuthorizationService: { incrementUnitsUsed: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockPost = {
    id: 'post-uuid',
    org_id: 'org-uuid',
    remittance_id: 'rem-uuid',
    claim_id: 'claim-uuid',
    billed_cents: 10000,
    paid_cents: 8000,
    patient_responsibility_cents: 1000,
  };

  const mockClaim = {
    id: 'claim-uuid',
    org_id: 'org-uuid',
    total_charge_cents: 10000,
    paid_amount_cents: 0,
    patient_responsibility_cents: 0,
    contractual_adj_cents: 0,
    balance_cents: 10000,
    status: ClaimStatus.PENDING,
    service_authorization_id: 'auth-uuid',
  };

  const mockLine = {
    id: 'line-uuid',
    org_id: 'org-uuid',
    claim_id: 'claim-uuid',
    units_billed: 4,
  };

  beforeEach(() => {
    paymentPostDal = {
      get: jest.fn().mockResolvedValue(mockPost),
      find: jest.fn().mockResolvedValue({
        payload: [mockPost],
        paginationMeta: { total: 1 },
      }),
      update: jest.fn().mockResolvedValue(mockPost),
      create: jest.fn().mockResolvedValue(mockPost),
    };
    adjustmentDal = {
      find: jest.fn().mockResolvedValue({ payload: [] }),
      create: jest.fn().mockImplementation((opts: { createPayload: Record<string, unknown> }) =>
        Promise.resolve({ id: 'adj-uuid', ...opts.createPayload }),
      ),
    };
    claimDal = {
      get: jest.fn().mockResolvedValue(mockClaim),
      find: jest.fn().mockResolvedValue({ payload: [mockClaim] }),
      update: jest.fn().mockResolvedValue(mockClaim),
    };
    claimLineDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockLine] }),
    };
    claimStatusHistoryDal = {
      create: jest.fn().mockResolvedValue({ id: 'csh-uuid' }),
    };
    serviceAuthorizationService = {
      incrementUnitsUsed: jest.fn().mockResolvedValue({}),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new PaymentPostingService(
      paymentPostDal as never,
      adjustmentDal as never,
      claimDal as never,
      claimLineDal as never,
      claimStatusHistoryDal as never,
      serviceAuthorizationService as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('postPayment', () => {
    it('should post a matched payment', async () => {
      const result = await service.postPayment(
        'post-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('post-uuid');
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYMENT_POSTED',
          record_id: 'post-uuid',
        }),
      );
    });

    it('should throw NotFoundException when post not found', async () => {
      paymentPostDal.get.mockResolvedValue(null);

      await expect(
        service.postPayment('bad-id', 'org-uuid', 'u', 'r', '127.0.0.1', 'j'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when post is not matched', async () => {
      paymentPostDal.get.mockResolvedValue({ ...mockPost, claim_id: null });

      await expect(
        service.postPayment('post-uuid', 'org-uuid', 'u', 'r', '127.0.0.1', 'j'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('applyPaymentToClaim', () => {
    it('should recalculate claim balance fields', async () => {
      await service.applyPaymentToClaim(
        'claim-uuid', 'org-uuid', 'user-uuid',
      );

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            paid_amount_cents: 8000,
            patient_responsibility_cents: 1000,
          }) as unknown,
        }),
      );
    });

    it('should transition to PAID when balance is zero', async () => {
      paymentPostDal.find.mockResolvedValue({
        payload: [{ ...mockPost, paid_cents: 9000, patient_responsibility_cents: 1000 }],
        paginationMeta: { total: 1 },
      });

      await service.applyPaymentToClaim(
        'claim-uuid', 'org-uuid', 'user-uuid',
      );

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ClaimStatus.PAID,
            paid_at: expect.any(Date) as unknown,
          }) as unknown,
        }),
      );
    });

    it('should transition to PARTIAL_PAYMENT when balance > 0 and paid > 0', async () => {
      paymentPostDal.find.mockResolvedValue({
        payload: [{ ...mockPost, paid_cents: 5000, patient_responsibility_cents: 0 }],
        paginationMeta: { total: 1 },
      });

      await service.applyPaymentToClaim(
        'claim-uuid', 'org-uuid', 'user-uuid',
      );

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ClaimStatus.PARTIAL_PAYMENT,
          }) as unknown,
        }),
      );
    });

    it('should record claim status history on transition', async () => {
      paymentPostDal.find.mockResolvedValue({
        payload: [{ ...mockPost, paid_cents: 9000, patient_responsibility_cents: 1000 }],
        paginationMeta: { total: 1 },
      });

      await service.applyPaymentToClaim(
        'claim-uuid', 'org-uuid', 'user-uuid',
      );

      expect(claimStatusHistoryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            claim_id: 'claim-uuid',
            from_status: ClaimStatus.PENDING,
            to_status: ClaimStatus.PAID,
            reason: 'Payment reconciliation',
          }) as unknown,
        }),
      );
    });

    it('should increment service authorization units on PAID', async () => {
      paymentPostDal.find.mockResolvedValue({
        payload: [{ ...mockPost, paid_cents: 9000, patient_responsibility_cents: 1000 }],
        paginationMeta: { total: 1 },
      });

      await service.applyPaymentToClaim(
        'claim-uuid', 'org-uuid', 'user-uuid',
      );

      expect(serviceAuthorizationService.incrementUnitsUsed).toHaveBeenCalledWith(
        'auth-uuid', 'org-uuid', 4,
      );
    });

    it('should throw NotFoundException when claim not found', async () => {
      claimDal.get.mockResolvedValue(null);

      await expect(
        service.applyPaymentToClaim('bad-id', 'org-uuid', 'u'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAdjustments', () => {
    it('should create adjustments with mapped CAS group codes', async () => {
      const eraAdjs = [
        { group_code: 'CO', reason_code: '45', amount_cents: 2000 },
        { group_code: 'PR', reason_code: '1', amount_cents: 500 },
      ];

      const result = await service.createAdjustments(
        'post-uuid', 'line-uuid', 'org-uuid', eraAdjs,
      );

      expect(result).toHaveLength(2);
      expect(adjustmentDal.create).toHaveBeenCalledTimes(2);
      expect(adjustmentDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            type: AdjustmentType.CONTRACTUAL,
            reason_code: '45',
            adjustment_amount_cents: 2000,
          }) as unknown,
        }),
      );
      expect(adjustmentDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            type: AdjustmentType.PATIENT_RESPONSIBILITY,
            reason_code: '1',
            adjustment_amount_cents: 500,
          }) as unknown,
        }),
      );
    });

    it('should map OA to OTHER and PI to PAYER_REDUCTION', async () => {
      const eraAdjs = [
        { group_code: 'OA', reason_code: '23', amount_cents: 100 },
        { group_code: 'PI', reason_code: '119', amount_cents: 200 },
      ];

      await service.createAdjustments('post-uuid', 'line-uuid', 'org-uuid', eraAdjs);

      expect(adjustmentDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            type: AdjustmentType.OTHER,
          }) as unknown,
        }),
      );
      expect(adjustmentDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            type: AdjustmentType.PAYER_REDUCTION,
          }) as unknown,
        }),
      );
    });

    it('should default unknown group codes to OTHER', async () => {
      await service.createAdjustments(
        'post-uuid', 'line-uuid', 'org-uuid',
        [{ group_code: 'XX', reason_code: '99', amount_cents: 100 }],
      );

      expect(adjustmentDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            type: AdjustmentType.OTHER,
          }) as unknown,
        }),
      );
    });
  });

  describe('listPaymentPosts', () => {
    it('should return paginated posts', async () => {
      const result = await service.listPaymentPosts('org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(paymentPostDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { page: 1, limit: 20 },
        }),
      );
    });

    it('should apply remittance_id filter', async () => {
      await service.listPaymentPosts('org-uuid', undefined, { remittance_id: 'rem-uuid' });

      expect(paymentPostDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            remittance_id: 'rem-uuid',
          }) as unknown,
        }),
      );
    });
  });

  describe('findPaymentPostById', () => {
    it('should return a post', async () => {
      const result = await service.findPaymentPostById('post-uuid', 'org-uuid');
      expect(result.id).toBe('post-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      paymentPostDal.get.mockResolvedValue(null);

      await expect(
        service.findPaymentPostById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listAdjustmentsByClaim', () => {
    it('should aggregate adjustments across all claim lines', async () => {
      adjustmentDal.find.mockResolvedValue({
        payload: [{ id: 'adj-uuid', claim_line_id: 'line-uuid' }],
      });

      const result = await service.listAdjustmentsByClaim('claim-uuid', 'org-uuid');

      expect(result).toHaveLength(1);
      expect(claimLineDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            claim_id: 'claim-uuid',
          }) as unknown,
        }),
      );
    });
  });

  describe('listAdjustmentsByPaymentPost', () => {
    it('should return adjustments for a payment post', async () => {
      adjustmentDal.find.mockResolvedValue({
        payload: [{ id: 'adj-uuid', payment_post_id: 'post-uuid' }],
      });

      const result = await service.listAdjustmentsByPaymentPost('post-uuid', 'org-uuid');

      expect(result.payload).toHaveLength(1);
    });
  });
});
