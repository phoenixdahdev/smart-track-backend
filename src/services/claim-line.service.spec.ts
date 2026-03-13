import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClaimLineService } from './claim-line.service';
import { ClaimStatus } from '@enums/claim-status.enum';

describe('ClaimLineService', () => {
  let service: ClaimLineService;
  let claimLineDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let claimDal: { get: jest.Mock; update: jest.Mock };
  let serviceCodeDal: { get: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockClaim = {
    id: 'claim-uuid',
    org_id: 'org-uuid',
    status: ClaimStatus.DRAFT,
    total_charge_cents: 6000,
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
    rendering_provider_npi: null,
    place_of_service: '12',
    diagnosis_pointer: [],
    line_number: 1,
  };

  beforeEach(() => {
    claimLineDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockClaimLine] }),
      get: jest.fn().mockResolvedValue(mockClaimLine),
      create: jest.fn().mockResolvedValue(mockClaimLine),
      update: jest.fn().mockResolvedValue(mockClaimLine),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    claimDal = {
      get: jest.fn().mockResolvedValue(mockClaim),
      update: jest.fn().mockResolvedValue(mockClaim),
    };
    serviceCodeDal = {
      get: jest.fn().mockResolvedValue({ id: 'sc-uuid', code: 'H2015' }),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new ClaimLineService(
      claimLineDal as never,
      claimDal as never,
      serviceCodeDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByClaimId', () => {
    it('should return claim lines ordered by line_number', async () => {
      const result = await service.findByClaimId('claim-uuid', 'org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(claimLineDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            claim_id: 'claim-uuid',
            org_id: 'org-uuid',
          }) as unknown,
          order: expect.objectContaining({ line_number: 'ASC' }) as unknown,
        }),
      );
    });
  });

  describe('addLine', () => {
    const dto = {
      service_code_id: 'sc-uuid',
      procedure_code: 'H2015',
      service_date: '2026-03-10',
      units_billed: 4,
      charge_cents: 6000,
    };

    it('should add a line to a DRAFT claim', async () => {
      const result = await service.addLine(
        'claim-uuid', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('cl-uuid');
      expect(claimLineDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            claim_id: 'claim-uuid',
            procedure_code: 'H2015',
          }) as unknown,
        }),
      );
    });

    it('should throw NotFoundException when claim not found', async () => {
      claimDal.get.mockResolvedValue(null);

      await expect(
        service.addLine('bad-id', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when claim is not DRAFT', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, status: ClaimStatus.SUBMITTED });

      await expect(
        service.addLine('claim-uuid', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should auto-increment line number', async () => {
      claimLineDal.find.mockResolvedValue({ payload: [mockClaimLine, { ...mockClaimLine, id: 'cl-uuid-2', line_number: 2 }] });

      await service.addLine(
        'claim-uuid', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(claimLineDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            line_number: 3,
          }) as unknown,
        }),
      );
    });

    it('should recalculate claim total after adding line', async () => {
      await service.addLine(
        'claim-uuid', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            total_charge_cents: expect.any(Number) as unknown,
            balance_cents: expect.any(Number) as unknown,
          }) as unknown,
        }),
      );
    });

    it('should log audit action on add', async () => {
      await service.addLine(
        'claim-uuid', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLAIM_LINE_ADDED',
          action_type: 'CREATE',
          table_name: 'claim_lines',
          record_id: 'cl-uuid',
        }),
      );
    });
  });

  describe('updateLine', () => {
    const dto = { charge_cents: 8000 };

    it('should update a claim line on a DRAFT claim', async () => {
      const result = await service.updateLine(
        'claim-uuid', 'cl-uuid', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('cl-uuid');
      expect(claimLineDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            id: 'cl-uuid',
            org_id: 'org-uuid',
          }) as unknown,
        }),
      );
    });

    it('should throw BadRequestException when claim is not DRAFT', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, status: ClaimStatus.SUBMITTED });

      await expect(
        service.updateLine('claim-uuid', 'cl-uuid', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when claim line not found', async () => {
      claimLineDal.get.mockResolvedValue(null);

      await expect(
        service.updateLine('claim-uuid', 'bad-id', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit action on update', async () => {
      await service.updateLine(
        'claim-uuid', 'cl-uuid', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLAIM_LINE_UPDATED',
          action_type: 'UPDATE',
          table_name: 'claim_lines',
          record_id: 'cl-uuid',
        }),
      );
    });
  });

  describe('removeLine', () => {
    it('should remove a claim line from a DRAFT claim', async () => {
      await service.removeLine(
        'claim-uuid', 'cl-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(claimLineDal.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            id: 'cl-uuid',
          }) as unknown,
        }),
      );
    });

    it('should throw BadRequestException when claim is not DRAFT', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, status: ClaimStatus.SUBMITTED });

      await expect(
        service.removeLine('claim-uuid', 'cl-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when claim line not found', async () => {
      claimLineDal.get.mockResolvedValue(null);

      await expect(
        service.removeLine('claim-uuid', 'bad-id', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should recalculate claim total after removing line', async () => {
      await service.removeLine(
        'claim-uuid', 'cl-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            total_charge_cents: expect.any(Number) as unknown,
          }) as unknown,
        }),
      );
    });

    it('should log audit action on remove', async () => {
      await service.removeLine(
        'claim-uuid', 'cl-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLAIM_LINE_REMOVED',
          action_type: 'DELETE',
          table_name: 'claim_lines',
          record_id: 'cl-uuid',
        }),
      );
    });
  });

  describe('recalculateClaimTotal', () => {
    it('should sum all line charge_cents and update the claim', async () => {
      claimLineDal.find.mockResolvedValue({
        payload: [
          { ...mockClaimLine, charge_cents: 3000 },
          { ...mockClaimLine, id: 'cl-uuid-2', charge_cents: 4500 },
        ],
      });

      const total = await service.recalculateClaimTotal('claim-uuid', 'org-uuid');

      expect(total).toBe(7500);
      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            total_charge_cents: 7500,
            balance_cents: 7500,
          }) as unknown,
        }),
      );
    });

    it('should set total to zero when no lines exist', async () => {
      claimLineDal.find.mockResolvedValue({ payload: [] });

      const total = await service.recalculateClaimTotal('claim-uuid', 'org-uuid');

      expect(total).toBe(0);
      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            total_charge_cents: 0,
            balance_cents: 0,
          }) as unknown,
        }),
      );
    });
  });
});
