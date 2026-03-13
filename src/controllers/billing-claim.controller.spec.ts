import { BadRequestException } from '@nestjs/common';
import { BillingClaimController } from './billing-claim.controller';
import { ClaimStatus } from '@enums/claim-status.enum';

describe('BillingClaimController', () => {
  let controller: BillingClaimController;
  let claimService: {
    findById: jest.Mock;
    list: jest.Mock;
    updateDraft: jest.Mock;
    transitionStatus: jest.Mock;
    voidClaim: jest.Mock;
    getDeniedClaims: jest.Mock;
    createReplacementClaim: jest.Mock;
    getStatusHistory: jest.Mock;
  };
  let claimMappingService: { mapServiceRecordsToClaim: jest.Mock };
  let claimValidationService: { validateAndStore: jest.Mock };
  let denialHandlerService: {
    appeal: jest.Mock;
    writeOff: jest.Mock;
    correctAndResubmit: jest.Mock;
  };

  const mockClaim = {
    id: 'claim-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    status: ClaimStatus.DRAFT,
    total_charge_cents: 6000,
  };

  const mockCurrentUser = {
    id: 'billing-uuid',
    org_id: 'org-uuid',
    role: 'BILLING_SPECIALIST',
    email: 'billing@test.com',
    name: 'Billing User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    email_verified: true,
  };

  const mockReq = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    claimService = {
      findById: jest.fn().mockResolvedValue(mockClaim),
      list: jest.fn().mockResolvedValue({
        payload: [mockClaim],
        paginationMeta: { total: 1, limit: 20, page: 1, total_pages: 1, has_next: false, has_previous: false },
      }),
      updateDraft: jest.fn().mockResolvedValue(mockClaim),
      transitionStatus: jest.fn().mockResolvedValue({ ...mockClaim, status: ClaimStatus.SUBMITTED }),
      voidClaim: jest.fn().mockResolvedValue({ ...mockClaim, status: ClaimStatus.VOID }),
      getDeniedClaims: jest.fn().mockResolvedValue({
        payload: [{ ...mockClaim, status: ClaimStatus.DENIED }],
        paginationMeta: { total: 1 },
      }),
      createReplacementClaim: jest.fn().mockResolvedValue({ ...mockClaim, id: 'new-claim-uuid', frequency_code: '7' }),
      getStatusHistory: jest.fn().mockResolvedValue({
        payload: [{ from_status: null, to_status: ClaimStatus.DRAFT }],
      }),
    };
    claimMappingService = {
      mapServiceRecordsToClaim: jest.fn().mockResolvedValue(mockClaim),
    };
    claimValidationService = {
      validateAndStore: jest.fn().mockResolvedValue({ valid: true, errors: [], warnings: [] }),
    };
    denialHandlerService = {
      appeal: jest.fn().mockResolvedValue({ ...mockClaim, status: ClaimStatus.APPEALED }),
      writeOff: jest.fn().mockResolvedValue({ ...mockClaim, status: ClaimStatus.VOID }),
      correctAndResubmit: jest.fn().mockResolvedValue({ ...mockClaim, id: 'replacement-uuid' }),
    };

    controller = new BillingClaimController(
      claimService as never,
      claimMappingService as never,
      claimValidationService as never,
      denialHandlerService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /billing/claims/generate', () => {
    it('should generate a claim from service record IDs', async () => {
      const dto = { service_record_ids: ['sr-uuid'] };

      const result = await controller.generate(dto as never, mockCurrentUser as never);

      expect(result.message).toBe('Claim generated');
      expect(result.data.id).toBe('claim-uuid');
      expect(claimMappingService.mapServiceRecordsToClaim).toHaveBeenCalledWith(
        ['sr-uuid'], 'org-uuid', 'billing-uuid',
      );
    });

    it('should throw BadRequestException when user has no org_id', async () => {
      const noOrgUser = { ...mockCurrentUser, org_id: null };

      await expect(
        controller.generate({ service_record_ids: ['sr-uuid'] } as never, noOrgUser as never),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /billing/claims', () => {
    it('should list claims', async () => {
      const query = { page: '1', limit: '20' };

      const result = await controller.list(mockCurrentUser as never, query as never);

      expect(result.message).toBe('Claims retrieved');
      expect(result.data).toHaveLength(1);
      expect(claimService.list).toHaveBeenCalledWith(
        'org-uuid', query, expect.objectContaining({
          status: undefined,
          individual_id: undefined,
        }),
      );
    });
  });

  describe('GET /billing/claims/denied', () => {
    it('should list denied claims', async () => {
      const result = await controller.denied(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('Denied claims retrieved');
      expect(claimService.getDeniedClaims).toHaveBeenCalledWith('org-uuid', {});
    });
  });

  describe('GET /billing/claims/:id', () => {
    it('should get a claim by ID', async () => {
      const result = await controller.findById('claim-uuid', 'org-uuid');

      expect(result.message).toBe('Claim retrieved');
      expect(result.data.id).toBe('claim-uuid');
    });
  });

  describe('PATCH /billing/claims/:id', () => {
    it('should update a DRAFT claim', async () => {
      const dto = { diagnosis_codes: ['F84.0'] };

      const result = await controller.update(
        'claim-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Claim updated');
      expect(claimService.updateDraft).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid', dto, 'billing-uuid', 'BILLING_SPECIALIST',
        '127.0.0.1', 'jest',
      );
    });
  });

  describe('POST /billing/claims/:id/validate', () => {
    it('should validate a claim', async () => {
      const result = await controller.validate('claim-uuid', 'org-uuid');

      expect(result.message).toBe('Claim validated');
      expect(claimValidationService.validateAndStore).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid',
      );
    });
  });

  describe('POST /billing/claims/:id/submit', () => {
    it('should submit a claim', async () => {
      const result = await controller.submit(
        'claim-uuid', mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Claim submitted');
      expect(claimService.transitionStatus).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid', 'SUBMITTED',
        'billing-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );
    });
  });

  describe('POST /billing/claims/:id/status', () => {
    it('should transition claim status', async () => {
      const dto = { status: ClaimStatus.SUBMITTED, reason: 'Ready for payer' };

      const result = await controller.transitionStatus(
        'claim-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Claim status updated');
      expect(claimService.transitionStatus).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid', ClaimStatus.SUBMITTED,
        'billing-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
        'Ready for payer',
      );
    });
  });

  describe('POST /billing/claims/:id/void', () => {
    it('should void a claim', async () => {
      const dto = { reason: 'Incorrect data' };

      const result = await controller.voidClaim(
        'claim-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Claim voided');
      expect(claimService.voidClaim).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid', 'billing-uuid', 'BILLING_SPECIALIST',
        'Incorrect data', '127.0.0.1', 'jest',
      );
    });
  });

  describe('POST /billing/claims/:id/replace', () => {
    it('should create a replacement claim', async () => {
      const result = await controller.replace('claim-uuid', mockCurrentUser as never);

      expect(result.message).toBe('Replacement claim created');
      expect(claimService.createReplacementClaim).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid', 'billing-uuid',
      );
    });
  });

  describe('GET /billing/claims/:id/history', () => {
    it('should get claim status history', async () => {
      const result = await controller.history('claim-uuid', 'org-uuid');

      expect(result.message).toBe('Status history retrieved');
      expect(claimService.getStatusHistory).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid',
      );
    });
  });

  describe('POST /billing/claims/:id/appeal', () => {
    it('should appeal a denied claim', async () => {
      const dto = { reason: 'Incorrect denial' };

      const result = await controller.appeal(
        'claim-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Claim appealed');
      expect(denialHandlerService.appeal).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid', 'billing-uuid', 'BILLING_SPECIALIST',
        'Incorrect denial', '127.0.0.1', 'jest',
      );
    });
  });

  describe('POST /billing/claims/:id/write-off', () => {
    it('should write off a claim', async () => {
      const dto = { reason: 'Uncollectible' };

      const result = await controller.writeOff(
        'claim-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Claim written off');
      expect(denialHandlerService.writeOff).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid', 'billing-uuid', 'BILLING_SPECIALIST',
        'Uncollectible', '127.0.0.1', 'jest',
      );
    });
  });

  describe('POST /billing/claims/:id/correct-and-resubmit', () => {
    it('should correct and resubmit a denied claim', async () => {
      const result = await controller.correctAndResubmit(
        'claim-uuid', mockCurrentUser as never,
      );

      expect(result.message).toBe('Replacement claim created');
      expect(denialHandlerService.correctAndResubmit).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid', 'billing-uuid',
      );
    });
  });
});
