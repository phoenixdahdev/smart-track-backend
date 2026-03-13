import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClaimService } from './claim.service';
import { ClaimStatus } from '@enums/claim-status.enum';

describe('ClaimService', () => {
  let service: ClaimService;
  let claimDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let claimLineDal: { find: jest.Mock; create: jest.Mock };
  let claimStatusHistoryDal: { find: jest.Mock; create: jest.Mock };
  let claimValidationService: { validateAndStore: jest.Mock };
  let serviceAuthorizationService: { findAuthForBilling: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockClaim = {
    id: 'claim-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    service_record_id: 'sr-uuid',
    payer_config_id: 'pc-uuid',
    claim_type: 'PROFESSIONAL_837P',
    subscriber_id: 'SUB-123',
    billing_provider_npi: '1234567890',
    billing_provider_ein: '123456789',
    billing_provider_name: 'Test Agency',
    billing_provider_address: { line1: '123 Main St', city: 'Springfield', state: 'IL', zip: '62701' },
    service_date_from: '2026-03-10',
    service_date_through: '2026-03-10',
    frequency_code: '1',
    place_of_service: '12',
    diagnosis_codes: [],
    total_charge_cents: 6000,
    status: ClaimStatus.DRAFT,
    service_authorization_id: null,
    created_by: 'user-uuid',
    original_claim_id: null,
    paid_amount_cents: 0,
    patient_responsibility_cents: 0,
    contractual_adj_cents: 0,
    balance_cents: 6000,
    denial_reason_codes: [],
  };

  const mockClaimLine = {
    id: 'cl-uuid',
    org_id: 'org-uuid',
    claim_id: 'claim-uuid',
    service_code_id: 'sc-uuid',
    procedure_code: 'H2015',
    modifiers: [],
    service_date: '2026-03-10',
    units_billed: 4,
    charge_cents: 6000,
    line_number: 1,
  };

  const mockHistory = {
    id: 'csh-uuid',
    claim_id: 'claim-uuid',
    from_status: null,
    to_status: ClaimStatus.DRAFT,
    changed_by: 'user-uuid',
    reason: null,
  };

  beforeEach(() => {
    claimDal = {
      get: jest.fn().mockResolvedValue(mockClaim),
      find: jest.fn().mockResolvedValue({
        payload: [mockClaim],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue({ ...mockClaim, id: 'new-claim-uuid' }),
      update: jest.fn().mockResolvedValue(mockClaim),
    };
    claimLineDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockClaimLine] }),
      create: jest.fn().mockResolvedValue(mockClaimLine),
    };
    claimStatusHistoryDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockHistory],
      }),
      create: jest.fn().mockResolvedValue(mockHistory),
    };
    claimValidationService = {
      validateAndStore: jest.fn().mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      }),
    };
    serviceAuthorizationService = {
      findAuthForBilling: jest.fn().mockResolvedValue(null),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new ClaimService(
      claimDal as never,
      claimLineDal as never,
      claimStatusHistoryDal as never,
      claimValidationService as never,
      serviceAuthorizationService as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a claim when found', async () => {
      const result = await service.findById('claim-uuid', 'org-uuid');
      expect(result.id).toBe('claim-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      claimDal.get.mockResolvedValue(null);

      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated claims', async () => {
      const result = await service.list('org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(claimDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            org_id: 'org-uuid',
          }) as unknown,
          paginationPayload: { page: 1, limit: 20 },
        }),
      );
    });

    it('should apply status filter', async () => {
      await service.list('org-uuid', undefined, { status: ClaimStatus.SUBMITTED });

      expect(claimDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            status: ClaimStatus.SUBMITTED,
          }) as unknown,
        }),
      );
    });

    it('should apply individual_id filter', async () => {
      await service.list('org-uuid', undefined, { individual_id: 'ind-uuid' });

      expect(claimDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            individual_id: 'ind-uuid',
          }) as unknown,
        }),
      );
    });

    it('should paginate results with custom page and limit', async () => {
      await service.list('org-uuid', { page: '2', limit: '10' } as never);

      expect(claimDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { page: 2, limit: 10 },
        }),
      );
    });
  });

  describe('updateDraft', () => {
    it('should update a DRAFT claim', async () => {
      const dto = { diagnosis_codes: ['F84.0'] };

      const result = await service.updateDraft(
        'claim-uuid', 'org-uuid', dto as never, 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('claim-uuid');
      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            id: 'claim-uuid',
            org_id: 'org-uuid',
          }) as unknown,
        }),
      );
    });

    it('should throw BadRequestException when claim is not DRAFT', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, status: ClaimStatus.SUBMITTED });

      await expect(
        service.updateDraft(
          'claim-uuid', 'org-uuid', {} as never, 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log audit action on update', async () => {
      await service.updateDraft(
        'claim-uuid', 'org-uuid', {} as never, 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLAIM_UPDATED',
          action_type: 'UPDATE',
          table_name: 'claims',
          record_id: 'claim-uuid',
        }),
      );
    });
  });

  describe('transitionStatus', () => {
    it('should transition from DRAFT to SUBMITTED', async () => {
      await service.transitionStatus(
        'claim-uuid', 'org-uuid', ClaimStatus.SUBMITTED,
        'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ClaimStatus.SUBMITTED,
          }) as unknown,
        }),
      );
    });

    it('should throw BadRequestException for invalid transition', async () => {
      await expect(
        service.transitionStatus(
          'claim-uuid', 'org-uuid', ClaimStatus.PAID,
          'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate before DRAFT -> SUBMITTED', async () => {
      await service.transitionStatus(
        'claim-uuid', 'org-uuid', ClaimStatus.SUBMITTED,
        'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(claimValidationService.validateAndStore).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid',
      );
    });

    it('should block DRAFT -> SUBMITTED when validation fails', async () => {
      claimValidationService.validateAndStore.mockResolvedValue({
        valid: false,
        errors: [{ code: 'NPI_MISSING', blocking: true, message: 'NPI missing' }],
        warnings: [],
      });

      await expect(
        service.transitionStatus(
          'claim-uuid', 'org-uuid', ClaimStatus.SUBMITTED,
          'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set submitted_at when transitioning to SUBMITTED', async () => {
      await service.transitionStatus(
        'claim-uuid', 'org-uuid', ClaimStatus.SUBMITTED,
        'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            submitted_at: expect.any(Date) as unknown,
          }) as unknown,
        }),
      );
    });

    it('should set paid_at when transitioning to PAID', async () => {
      claimDal.get.mockResolvedValue({
        ...mockClaim,
        status: ClaimStatus.PENDING,
      });

      await service.transitionStatus(
        'claim-uuid', 'org-uuid', ClaimStatus.PAID,
        'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            paid_at: expect.any(Date) as unknown,
          }) as unknown,
        }),
      );
    });

    it('should record status history', async () => {
      await service.transitionStatus(
        'claim-uuid', 'org-uuid', ClaimStatus.SUBMITTED,
        'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(claimStatusHistoryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            claim_id: 'claim-uuid',
            from_status: ClaimStatus.DRAFT,
            to_status: ClaimStatus.SUBMITTED,
            changed_by: 'user-uuid',
          }) as unknown,
        }),
      );
    });

    it('should log audit action on transition', async () => {
      await service.transitionStatus(
        'claim-uuid', 'org-uuid', ClaimStatus.SUBMITTED,
        'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: `CLAIM_${ClaimStatus.SUBMITTED}`,
          action_type: 'UPDATE',
          table_name: 'claims',
          record_id: 'claim-uuid',
        }),
      );
    });
  });

  describe('voidClaim', () => {
    it('should void a PAID claim', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, status: ClaimStatus.PAID });

      await service.voidClaim(
        'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'Incorrect claim', '127.0.0.1', 'jest',
      );

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ClaimStatus.VOID,
          }) as unknown,
        }),
      );
    });

    it('should throw BadRequestException when void transition is invalid', async () => {
      // DRAFT cannot go to VOID
      await expect(
        service.voidClaim(
          'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'reason', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should pass reason to status history', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, status: ClaimStatus.PAID });

      await service.voidClaim(
        'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'Incorrect claim', '127.0.0.1', 'jest',
      );

      expect(claimStatusHistoryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            reason: 'Incorrect claim',
          }) as unknown,
        }),
      );
    });
  });

  describe('getDeniedClaims', () => {
    it('should return claims with DENIED status', async () => {
      const result = await service.getDeniedClaims('org-uuid');

      expect(claimDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            status: ClaimStatus.DENIED,
          }) as unknown,
        }),
      );
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('createReplacementClaim', () => {
    it('should create a replacement claim with frequency_code 7', async () => {
      await service.createReplacementClaim('claim-uuid', 'org-uuid', 'user-uuid');

      expect(claimDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            frequency_code: '7',
            original_claim_id: 'claim-uuid',
            status: ClaimStatus.DRAFT,
          }) as unknown,
        }),
      );
    });

    it('should copy claim lines from the original', async () => {
      await service.createReplacementClaim('claim-uuid', 'org-uuid', 'user-uuid');

      expect(claimLineDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            claim_id: 'claim-uuid',
            org_id: 'org-uuid',
          }) as unknown,
        }),
      );
      expect(claimLineDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            claim_id: 'new-claim-uuid',
            procedure_code: 'H2015',
            line_number: 1,
          }) as unknown,
        }),
      );
    });

    it('should record status history for replacement claim', async () => {
      await service.createReplacementClaim('claim-uuid', 'org-uuid', 'user-uuid');

      expect(claimStatusHistoryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            claim_id: 'new-claim-uuid',
            from_status: null,
            to_status: ClaimStatus.DRAFT,
            reason: expect.stringContaining('Replacement') as unknown,
          }) as unknown,
        }),
      );
    });

    it('should throw NotFoundException when original claim not found', async () => {
      claimDal.get.mockResolvedValue(null);

      await expect(
        service.createReplacementClaim('bad-id', 'org-uuid', 'user-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatusHistory', () => {
    it('should return status history for a claim', async () => {
      const result = await service.getStatusHistory('claim-uuid', 'org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(claimStatusHistoryDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            claim_id: 'claim-uuid',
            org_id: 'org-uuid',
          }) as unknown,
        }),
      );
    });

    it('should throw NotFoundException when claim not found', async () => {
      claimDal.get.mockResolvedValue(null);

      await expect(
        service.getStatusHistory('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
