import { NotFoundException } from '@nestjs/common';
import { RemittanceService } from './remittance.service';
import { RemittanceStatus } from '@enums/remittance-status.enum';
import { MatchingMethod } from '@enums/matching-method.enum';

describe('RemittanceService', () => {
  let service: RemittanceService;
  let remittanceDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let paymentPostDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let claimLineDal: { find: jest.Mock };
  let paymentMatchingService: { matchPaymentPost: jest.Mock };
  let paymentPostingService: { createAdjustments: jest.Mock; applyPaymentToClaim: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockRemittance = {
    id: 'rem-uuid',
    org_id: 'org-uuid',
    payer_config_id: 'pc-uuid',
    payment_date: '2026-03-15',
    eft_trace_number: 'EFT-001',
    eft_total_cents: 150000,
    interchange_control_num: null,
    status: RemittanceStatus.RECEIVED,
  };

  const mockPost = {
    id: 'post-uuid',
    org_id: 'org-uuid',
    remittance_id: 'rem-uuid',
    claim_id: null,
    billed_cents: 10000,
    paid_cents: 8000,
  };

  const mockMatchedPost = {
    ...mockPost,
    claim_id: 'claim-uuid',
  };

  beforeEach(() => {
    remittanceDal = {
      get: jest.fn().mockResolvedValue(mockRemittance),
      find: jest.fn().mockResolvedValue({
        payload: [mockRemittance],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockRemittance),
      update: jest.fn().mockResolvedValue(mockRemittance),
    };
    paymentPostDal = {
      get: jest.fn().mockResolvedValue(mockPost),
      find: jest.fn().mockResolvedValue({
        payload: [mockMatchedPost],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockPost),
      update: jest.fn().mockResolvedValue(mockMatchedPost),
    };
    claimLineDal = {
      find: jest.fn().mockResolvedValue({
        payload: [{ id: 'line-uuid', claim_id: 'claim-uuid' }],
      }),
    };
    paymentMatchingService = {
      matchPaymentPost: jest.fn().mockResolvedValue({
        claim_id: 'claim-uuid',
        method: MatchingMethod.CLAIM_ID,
        confidence: 1.0,
      }),
    };
    paymentPostingService = {
      createAdjustments: jest.fn().mockResolvedValue([]),
      applyPaymentToClaim: jest.fn().mockResolvedValue({}),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new RemittanceService(
      remittanceDal as never,
      paymentPostDal as never,
      claimLineDal as never,
      paymentMatchingService as never,
      paymentPostingService as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingestEra', () => {
    const dto = {
      payer_config_id: 'pc-uuid',
      payment_date: '2026-03-15',
      eft_trace_number: 'EFT-001',
      eft_total_cents: 150000,
      claim_payments: [
        {
          claim_id: 'claim-uuid',
          billed_cents: 10000,
          paid_cents: 8000,
          patient_responsibility_cents: 1000,
          adjustments: [
            { group_code: 'CO', reason_code: '45', amount_cents: 1000 },
          ],
        },
      ],
    };

    it('should create a remittance record', async () => {
      await service.ingestEra(dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest');

      expect(remittanceDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            payer_config_id: 'pc-uuid',
            eft_total_cents: 150000,
            status: RemittanceStatus.RECEIVED,
          }) as unknown,
        }),
      );
    });

    it('should create payment posts for each claim payment', async () => {
      await service.ingestEra(dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest');

      expect(paymentPostDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            remittance_id: 'rem-uuid',
            billed_cents: 10000,
            paid_cents: 8000,
          }) as unknown,
        }),
      );
    });

    it('should run matching cascade for each payment', async () => {
      await service.ingestEra(dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest');

      expect(paymentMatchingService.matchPaymentPost).toHaveBeenCalledWith(
        dto.claim_payments[0],
        'org-uuid',
      );
    });

    it('should update post with match info when matched', async () => {
      await service.ingestEra(dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest');

      expect(paymentPostDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            claim_id: 'claim-uuid',
            matching_method: MatchingMethod.CLAIM_ID,
            matching_confidence: 1.0,
          }) as unknown,
        }),
      );
    });

    it('should create adjustments when present', async () => {
      await service.ingestEra(dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest');

      expect(paymentPostingService.createAdjustments).toHaveBeenCalledWith(
        'post-uuid',
        'line-uuid',
        'org-uuid',
        dto.claim_payments[0].adjustments,
      );
    });

    it('should apply payment to matched claim', async () => {
      await service.ingestEra(dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest');

      expect(paymentPostingService.applyPaymentToClaim).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid', 'user-uuid',
      );
    });

    it('should set FULLY_POSTED when all payments matched', async () => {
      await service.ingestEra(dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest');

      expect(remittanceDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: RemittanceStatus.FULLY_POSTED,
          }) as unknown,
        }),
      );
    });

    it('should set UNMATCHED when no payments matched', async () => {
      paymentMatchingService.matchPaymentPost.mockResolvedValue(null);

      await service.ingestEra(dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest');

      expect(remittanceDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: RemittanceStatus.UNMATCHED,
          }) as unknown,
        }),
      );
    });

    it('should set PARTIAL when some payments matched', async () => {
      const multiDto = {
        ...dto,
        claim_payments: [
          { claim_id: 'claim-uuid', billed_cents: 10000, paid_cents: 8000 },
          { billed_cents: 5000, paid_cents: 3000 },
        ],
      };
      paymentMatchingService.matchPaymentPost
        .mockResolvedValueOnce({ claim_id: 'claim-uuid', method: MatchingMethod.CLAIM_ID, confidence: 1.0 })
        .mockResolvedValueOnce(null);

      await service.ingestEra(multiDto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest');

      expect(remittanceDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: RemittanceStatus.PARTIAL,
          }) as unknown,
        }),
      );
    });

    it('should log audit action', async () => {
      await service.ingestEra(dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ERA_INGESTED',
          action_type: 'CREATE',
          table_name: 'remittances',
          record_id: 'rem-uuid',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a remittance', async () => {
      const result = await service.findById('rem-uuid', 'org-uuid');
      expect(result.id).toBe('rem-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      remittanceDal.get.mockResolvedValue(null);

      await expect(service.findById('bad-id', 'org-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated remittances', async () => {
      const result = await service.list('org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(remittanceDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { page: 1, limit: 20 },
        }),
      );
    });

    it('should apply status filter', async () => {
      await service.list('org-uuid', undefined, { status: RemittanceStatus.FULLY_POSTED });

      expect(remittanceDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            status: RemittanceStatus.FULLY_POSTED,
          }) as unknown,
        }),
      );
    });

    it('should apply payer_config_id filter', async () => {
      await service.list('org-uuid', undefined, { payer_config_id: 'pc-uuid' });

      expect(remittanceDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            payer_config_id: 'pc-uuid',
          }) as unknown,
        }),
      );
    });
  });

  describe('getPaymentPosts', () => {
    it('should return posts for a remittance', async () => {
      const result = await service.getPaymentPosts('rem-uuid', 'org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(paymentPostDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            remittance_id: 'rem-uuid',
          }) as unknown,
        }),
      );
    });

    it('should throw NotFoundException when remittance not found', async () => {
      remittanceDal.get.mockResolvedValue(null);

      await expect(service.getPaymentPosts('bad-id', 'org-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('recalculateStatus', () => {
    it('should set FULLY_POSTED when all posts matched', async () => {
      const result = await service.recalculateStatus('rem-uuid', 'org-uuid');

      expect(result.status).toBe(RemittanceStatus.FULLY_POSTED);
      expect(remittanceDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: RemittanceStatus.FULLY_POSTED,
          }) as unknown,
        }),
      );
    });

    it('should set UNMATCHED when no posts matched', async () => {
      paymentPostDal.find.mockResolvedValue({
        payload: [{ ...mockPost, claim_id: null }],
        paginationMeta: { total: 1 },
      });

      const result = await service.recalculateStatus('rem-uuid', 'org-uuid');

      expect(result.status).toBe(RemittanceStatus.UNMATCHED);
    });

    it('should set PARTIAL when some posts matched', async () => {
      paymentPostDal.find.mockResolvedValue({
        payload: [
          { ...mockPost, claim_id: 'claim-uuid' },
          { ...mockPost, id: 'post-2', claim_id: null },
        ],
        paginationMeta: { total: 2 },
      });

      const result = await service.recalculateStatus('rem-uuid', 'org-uuid');

      expect(result.status).toBe(RemittanceStatus.PARTIAL);
    });

    it('should set RECEIVED when no posts exist', async () => {
      paymentPostDal.find.mockResolvedValue({
        payload: [],
        paginationMeta: { total: 0 },
      });

      const result = await service.recalculateStatus('rem-uuid', 'org-uuid');

      expect(result.status).toBe(RemittanceStatus.RECEIVED);
    });
  });
});
