import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClaimSubmissionService } from './claim-submission.service';
import { ClaimStatus } from '@enums/claim-status.enum';

describe('ClaimSubmissionService', () => {
  let service: ClaimSubmissionService;
  let claimSubmissionDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let claimDal: { get: jest.Mock; update: jest.Mock };
  let claimStatusHistoryDal: { create: jest.Mock };
  let ediGeneratorService: { buildClearinghousePayload: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockClaim = {
    id: 'claim-uuid',
    org_id: 'org-uuid',
    claim_type: 'PROFESSIONAL_837P',
    status: ClaimStatus.DRAFT,
    payer_config_id: 'pc-uuid',
  };

  const mockPayload = {
    claim_id: 'claim-uuid',
    payer: { clearinghouse_routing: { id: 'CH001' } },
  };

  const mockSubmission = {
    id: 'sub-uuid',
    org_id: 'org-uuid',
    claim_id: 'claim-uuid',
    submitted_at: new Date(),
  };

  beforeEach(() => {
    claimSubmissionDal = {
      get: jest.fn().mockResolvedValue(mockSubmission),
      find: jest.fn().mockResolvedValue({ payload: [mockSubmission], paginationMeta: { total: 1 } }),
      create: jest.fn().mockResolvedValue(mockSubmission),
      update: jest.fn().mockResolvedValue(mockSubmission),
    };
    claimDal = {
      get: jest.fn().mockResolvedValue(mockClaim),
      update: jest.fn().mockResolvedValue(mockClaim),
    };
    claimStatusHistoryDal = {
      create: jest.fn().mockResolvedValue(undefined),
    };
    ediGeneratorService = {
      buildClearinghousePayload: jest.fn().mockResolvedValue(mockPayload),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new ClaimSubmissionService(
      claimSubmissionDal as never,
      claimDal as never,
      claimStatusHistoryDal as never,
      ediGeneratorService as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitClaim', () => {
    it('should create a submission and transition claim to SUBMITTED', async () => {
      const result = await service.submitClaim(
        'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('sub-uuid');
      expect(claimSubmissionDal.create).toHaveBeenCalled();
      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ClaimStatus.SUBMITTED,
          }) as unknown,
        }),
      );
    });

    it('should throw when claim not found', async () => {
      claimDal.get.mockResolvedValue(null);

      await expect(
        service.submitClaim('bad-id', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when claim not in valid status for submission', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, status: ClaimStatus.PAID });

      await expect(
        service.submitClaim('claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should record status history', async () => {
      await service.submitClaim(
        'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(claimStatusHistoryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            from_status: ClaimStatus.DRAFT,
            to_status: ClaimStatus.SUBMITTED,
          }) as unknown,
        }),
      );
    });

    it('should log audit action', async () => {
      await service.submitClaim(
        'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLAIM_SUBMISSION_CREATED',
        }),
      );
    });
  });

  describe('submitBatch', () => {
    it('should submit multiple claims', async () => {
      const result = await service.submitBatch(
        ['claim-1', 'claim-2'], 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(result).toHaveLength(2);
    });
  });

  describe('recordResponse', () => {
    it('should record ACCEPTED response and transition claim to ACCEPTED_277', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, status: ClaimStatus.SUBMITTED });

      await service.recordResponse(
        'sub-uuid', 'ACCEPTED', { message: 'ok' }, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(claimSubmissionDal.update).toHaveBeenCalled();
      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ClaimStatus.ACCEPTED_277,
          }) as unknown,
        }),
      );
    });

    it('should record REJECTED response and transition to REJECTED_277', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, status: ClaimStatus.SUBMITTED });

      await service.recordResponse(
        'sub-uuid', 'REJECTED', { error: 'invalid' }, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ClaimStatus.REJECTED_277,
          }) as unknown,
        }),
      );
    });

    it('should throw when submission not found', async () => {
      claimSubmissionDal.get.mockResolvedValue(null);

      await expect(
        service.recordResponse(
          'bad-id', 'ACCEPTED', {}, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit action', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, status: ClaimStatus.SUBMITTED });

      await service.recordResponse(
        'sub-uuid', 'ACCEPTED', {}, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLAIM_SUBMISSION_RESPONSE_RECORDED',
        }),
      );
    });
  });

  describe('findByClaimId', () => {
    it('should return submissions for a claim', async () => {
      const result = await service.findByClaimId('claim-uuid', 'org-uuid');
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('list', () => {
    it('should return paginated submissions', async () => {
      const result = await service.list('org-uuid');
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return submission when found', async () => {
      const result = await service.findById('sub-uuid', 'org-uuid');
      expect(result.id).toBe('sub-uuid');
    });

    it('should throw when not found', async () => {
      claimSubmissionDal.get.mockResolvedValue(null);

      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
