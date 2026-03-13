import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClaimMappingService } from './claim-mapping.service';
import { ClaimStatus } from '@enums/claim-status.enum';
import { ClaimType } from '@enums/claim-type.enum';

describe('ClaimMappingService', () => {
  let service: ClaimMappingService;
  let claimDal: { create: jest.Mock; get: jest.Mock; update: jest.Mock; find: jest.Mock };
  let claimLineDal: { create: jest.Mock; find: jest.Mock };
  let claimStatusHistoryDal: { create: jest.Mock };
  let serviceRecordDal: { get: jest.Mock };
  let coverageDal: { find: jest.Mock };
  let serviceCodeDal: { get: jest.Mock };
  let programDal: { get: jest.Mock };
  let organizationDal: { get: jest.Mock };
  let individualDal: { get: jest.Mock };
  let rateTableService: { findRate: jest.Mock };
  let serviceAuthorizationService: { findAuthForBilling: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockServiceRecord = {
    id: 'sr-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    staff_id: 'staff-uuid',
    program_id: 'prog-uuid',
    service_date: '2026-03-10',
    service_code_id: 'sc-uuid',
    units_delivered: 4,
    status: 'APPROVED',
  };

  const mockCoverage = {
    id: 'cov-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    payer_config_id: 'pc-uuid',
    subscriber_id: 'SUB-123',
    coverage_start: '2026-01-01',
    coverage_end: null,
    priority: 1,
    active: true,
  };

  const mockOrg = {
    id: 'org-uuid',
    npi: '1234567890',
    ein: '123456789',
    legal_name: 'Test Agency',
    address_line1: '123 Main St',
    address_line2: null,
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
  };

  const mockRate = { rate_cents: 1500 };
  const mockClaim = { id: 'claim-uuid', org_id: 'org-uuid', total_charge_cents: 0 };
  const mockAuth = { id: 'auth-uuid' };
  const mockProgram = { id: 'prog-uuid', billing_type: 'PROFESSIONAL' };
  const mockServiceCode = { id: 'sc-uuid', code: 'H2015' };

  beforeEach(() => {
    claimDal = {
      create: jest.fn().mockResolvedValue(mockClaim),
      get: jest.fn().mockResolvedValue(mockClaim),
      update: jest.fn().mockResolvedValue({ ...mockClaim, total_charge_cents: 6000 }),
      find: jest.fn().mockResolvedValue({ payload: [] }),
    };
    claimLineDal = {
      create: jest.fn().mockResolvedValue({ id: 'cl-uuid', line_number: 1 }),
      find: jest.fn().mockResolvedValue({ payload: [] }),
    };
    claimStatusHistoryDal = {
      create: jest.fn().mockResolvedValue({ id: 'csh-uuid' }),
    };
    serviceRecordDal = {
      get: jest.fn().mockResolvedValue(mockServiceRecord),
    };
    coverageDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockCoverage] }),
    };
    serviceCodeDal = {
      get: jest.fn().mockResolvedValue(mockServiceCode),
    };
    programDal = {
      get: jest.fn().mockResolvedValue(mockProgram),
    };
    organizationDal = {
      get: jest.fn().mockResolvedValue(mockOrg),
    };
    individualDal = {
      get: jest.fn().mockResolvedValue({ id: 'ind-uuid' }),
    };
    rateTableService = {
      findRate: jest.fn().mockResolvedValue(mockRate),
    };
    serviceAuthorizationService = {
      findAuthForBilling: jest.fn().mockResolvedValue(mockAuth),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new ClaimMappingService(
      claimDal as never,
      claimLineDal as never,
      claimStatusHistoryDal as never,
      serviceRecordDal as never,
      coverageDal as never,
      serviceCodeDal as never,
      programDal as never,
      organizationDal as never,
      individualDal as never,
      rateTableService as never,
      serviceAuthorizationService as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mapSingleRecord', () => {
    it('should delegate to mapServiceRecordsToClaim with single-element array', async () => {
      await service.mapSingleRecord('sr-uuid', 'org-uuid', 'user-uuid');

      expect(serviceRecordDal.get).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            id: 'sr-uuid',
            org_id: 'org-uuid',
          }) as unknown,
        }),
      );
      expect(claimDal.create).toHaveBeenCalled();
    });
  });

  describe('mapServiceRecordsToClaim', () => {
    it('should throw BadRequestException when service record IDs array is empty', async () => {
      await expect(
        service.mapServiceRecordsToClaim([], 'org-uuid', 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when a service record is not found', async () => {
      serviceRecordDal.get.mockResolvedValue(null);

      await expect(
        service.mapServiceRecordsToClaim(['bad-id'], 'org-uuid', 'user-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when service record is not APPROVED', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockServiceRecord,
        status: 'DRAFT',
      });

      await expect(
        service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when records have different individuals', async () => {
      const record1 = { ...mockServiceRecord, id: 'sr-1', individual_id: 'ind-1' };
      const record2 = { ...mockServiceRecord, id: 'sr-2', individual_id: 'ind-2' };

      serviceRecordDal.get
        .mockResolvedValueOnce(record1)
        .mockResolvedValueOnce(record2);

      await expect(
        service.mapServiceRecordsToClaim(['sr-1', 'sr-2'], 'org-uuid', 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a claim with DRAFT status', async () => {
      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(claimDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            individual_id: 'ind-uuid',
            status: ClaimStatus.DRAFT,
            frequency_code: '1',
            created_by: 'user-uuid',
          }) as unknown,
        }),
      );
    });

    it('should create claim lines for each service record', async () => {
      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(claimLineDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            claim_id: 'claim-uuid',
            procedure_code: 'H2015',
            units_billed: 4,
            line_number: 1,
          }) as unknown,
        }),
      );
    });

    it('should record status history for new claim', async () => {
      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(claimStatusHistoryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            claim_id: 'claim-uuid',
            from_status: null,
            to_status: ClaimStatus.DRAFT,
            changed_by: 'user-uuid',
          }) as unknown,
        }),
      );
    });

    it('should resolve payer coverage for the individual', async () => {
      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(coverageDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            org_id: 'org-uuid',
            individual_id: 'ind-uuid',
            active: true,
          }) as unknown,
        }),
      );
    });

    it('should throw BadRequestException when no payer coverage found', async () => {
      coverageDal.find.mockResolvedValue({ payload: [] });

      await expect(
        service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should resolve rate from rate table service', async () => {
      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(rateTableService.findRate).toHaveBeenCalledWith(
        'pc-uuid', 'sc-uuid', '2026-03-10', 'org-uuid',
      );
    });

    it('should calculate charge as rate_cents * units_delivered', async () => {
      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(claimLineDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            charge_cents: 6000, // 1500 * 4
          }) as unknown,
        }),
      );
    });

    it('should use zero charge when rate is not found', async () => {
      rateTableService.findRate.mockResolvedValue(null);

      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(claimLineDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            charge_cents: 0,
          }) as unknown,
        }),
      );
    });

    it('should use org info for billing provider', async () => {
      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(claimDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            billing_provider_npi: '1234567890',
            billing_provider_ein: '123456789',
            billing_provider_name: 'Test Agency',
          }) as unknown,
        }),
      );
    });

    it('should throw when organization is not found', async () => {
      organizationDal.get.mockResolvedValue(null);

      await expect(
        service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set service_authorization_id when matching auth found', async () => {
      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(claimDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            service_authorization_id: 'auth-uuid',
          }) as unknown,
        }),
      );
    });

    it('should set service_authorization_id to null when no auth found', async () => {
      serviceAuthorizationService.findAuthForBilling.mockResolvedValue(null);

      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(claimDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            service_authorization_id: null,
          }) as unknown,
        }),
      );
    });

    it('should resolve INSTITUTIONAL_837I claim type for institutional program', async () => {
      programDal.get.mockResolvedValue({ id: 'prog-uuid', billing_type: 'INSTITUTIONAL' });

      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(claimDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            claim_type: ClaimType.INSTITUTIONAL_837I,
          }) as unknown,
        }),
      );
    });

    it('should default to PROFESSIONAL_837P claim type', async () => {
      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(claimDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            claim_type: ClaimType.PROFESSIONAL_837P,
          }) as unknown,
        }),
      );
    });

    it('should update total charge on the claim after creating lines', async () => {
      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            id: 'claim-uuid',
            org_id: 'org-uuid',
          }) as unknown,
          updatePayload: expect.objectContaining({
            total_charge_cents: 6000,
            balance_cents: 6000,
          }) as unknown,
        }),
      );
    });
  });

  describe('audit logging', () => {
    it('should log CLAIM_GENERATED audit action', async () => {
      await service.mapServiceRecordsToClaim(['sr-uuid'], 'org-uuid', 'user-uuid');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          org_id: 'org-uuid',
          user_id: 'user-uuid',
          action: 'CLAIM_GENERATED',
          action_type: 'CREATE',
          table_name: 'claims',
          record_id: 'claim-uuid',
        }),
      );
    });
  });
});
