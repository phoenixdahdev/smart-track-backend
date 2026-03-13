import { BadRequestException } from '@nestjs/common';
import { DenialHandlerService } from './denial-handler.service';
import { ClaimStatus } from '@enums/claim-status.enum';

describe('DenialHandlerService', () => {
  let service: DenialHandlerService;
  let claimDal: { get: jest.Mock; update: jest.Mock };
  let claimStatusHistoryDal: { create: jest.Mock };
  let claimMappingService: { mapSingleRecord: jest.Mock };
  let serviceAuthorizationService: { findAuthForBilling: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockClaim = {
    id: 'claim-uuid',
    org_id: 'org-uuid',
    service_record_id: 'sr-uuid',
    individual_id: 'ind-uuid',
    status: ClaimStatus.DENIED,
    total_charge_cents: 6000,
    balance_cents: 6000,
  };

  beforeEach(() => {
    claimDal = {
      get: jest.fn().mockResolvedValue(mockClaim),
      update: jest.fn().mockResolvedValue({ ...mockClaim, status: ClaimStatus.APPEALED }),
    };
    claimStatusHistoryDal = {
      create: jest.fn().mockResolvedValue({ id: 'csh-uuid' }),
    };
    claimMappingService = {
      mapSingleRecord: jest.fn().mockResolvedValue({ id: 'new-claim-uuid' }),
    };
    serviceAuthorizationService = {
      findAuthForBilling: jest.fn().mockResolvedValue(null),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new DenialHandlerService(
      claimDal as never,
      claimStatusHistoryDal as never,
      claimMappingService as never,
      serviceAuthorizationService as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleDenial', () => {
    it('should return category and suggestion for known denial code', () => {
      const result = service.handleDenial('CO-4');

      expect(result.denial_code).toBe('CO-4');
      expect(result.category).toBe('CODING');
      expect(result.suggestion).toBe('Review procedure code and modifiers');
    });

    it('should return UNKNOWN category for unknown denial code', () => {
      const result = service.handleDenial('XX-999');

      expect(result.denial_code).toBe('XX-999');
      expect(result.category).toBe('UNKNOWN');
      expect(result.suggestion).toBe('Review claim details and contact payer');
    });

    it('should handle CO-97 authorization denial', () => {
      const result = service.handleDenial('CO-97');

      expect(result.category).toBe('AUTHORIZATION');
    });

    it('should handle CO-18 duplicate denial', () => {
      const result = service.handleDenial('CO-18');

      expect(result.category).toBe('DUPLICATE');
    });
  });

  describe('appeal', () => {
    it('should appeal a DENIED claim', async () => {
      const result = await service.appeal(
        'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'Incorrect denial', '127.0.0.1', 'jest',
      );

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ClaimStatus.APPEALED,
          }) as unknown,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should record status history on appeal', async () => {
      await service.appeal(
        'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'Incorrect denial', '127.0.0.1', 'jest',
      );

      expect(claimStatusHistoryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            claim_id: 'claim-uuid',
            from_status: ClaimStatus.DENIED,
            to_status: ClaimStatus.APPEALED,
            changed_by: 'user-uuid',
            reason: 'Incorrect denial',
          }) as unknown,
        }),
      );
    });

    it('should throw BadRequestException when claim not found', async () => {
      claimDal.get.mockResolvedValue(null);

      await expect(
        service.appeal('bad-id', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'reason', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid transition', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, status: ClaimStatus.DRAFT });

      await expect(
        service.appeal('claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'reason', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log audit action on appeal', async () => {
      await service.appeal(
        'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'reason', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLAIM_APPEALED',
          action_type: 'UPDATE',
          table_name: 'claims',
          record_id: 'claim-uuid',
        }),
      );
    });
  });

  describe('writeOff', () => {
    it('should write off a DENIED claim by voiding it', async () => {
      claimDal.update.mockResolvedValue({ ...mockClaim, status: ClaimStatus.VOID, balance_cents: 0 });

      await service.writeOff(
        'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'Uncollectible', '127.0.0.1', 'jest',
      );

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ClaimStatus.VOID,
            balance_cents: 0,
          }) as unknown,
        }),
      );
    });

    it('should record status history with write-off reason', async () => {
      await service.writeOff(
        'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'Uncollectible', '127.0.0.1', 'jest',
      );

      expect(claimStatusHistoryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            from_status: ClaimStatus.DENIED,
            to_status: ClaimStatus.VOID,
            reason: 'Write-off: Uncollectible',
          }) as unknown,
        }),
      );
    });

    it('should throw BadRequestException for invalid transition', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, status: ClaimStatus.DRAFT });

      await expect(
        service.writeOff('claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'reason', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log audit action on write-off', async () => {
      await service.writeOff(
        'claim-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'reason', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLAIM_WRITTEN_OFF',
          action_type: 'UPDATE',
          table_name: 'claims',
          record_id: 'claim-uuid',
        }),
      );
    });
  });

  describe('correctAndResubmit', () => {
    it('should void the original claim', async () => {
      await service.correctAndResubmit('claim-uuid', 'org-uuid', 'user-uuid');

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            id: 'claim-uuid',
            org_id: 'org-uuid',
          }) as unknown,
          updatePayload: expect.objectContaining({
            status: ClaimStatus.VOID,
          }) as unknown,
        }),
      );
    });

    it('should create a replacement claim via mapping service', async () => {
      const result = await service.correctAndResubmit('claim-uuid', 'org-uuid', 'user-uuid');

      expect(claimMappingService.mapSingleRecord).toHaveBeenCalledWith(
        'sr-uuid', 'org-uuid', 'user-uuid',
      );
      expect(result.id).toBe('new-claim-uuid');
    });

    it('should throw BadRequestException when claim not found', async () => {
      claimDal.get.mockResolvedValue(null);

      await expect(
        service.correctAndResubmit('bad-id', 'org-uuid', 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
