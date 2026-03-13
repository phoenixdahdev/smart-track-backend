import { NotFoundException } from '@nestjs/common';
import { IndividualPayerCoverageService } from './individual-payer-coverage.service';

describe('IndividualPayerCoverageService', () => {
  let service: IndividualPayerCoverageService;
  let coverageDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let individualDal: { get: jest.Mock };
  let payerConfigDal: { get: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockRecord = {
    id: 'cov-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    payer_config_id: 'pc-uuid',
    subscriber_id: 'SUB-001',
    member_id: 'MEM-001',
    group_number: 'GRP-001',
    relationship: 'SELF',
    coverage_start: '2026-01-01',
    coverage_end: '2026-12-31',
    priority: 1,
    active: true,
  };

  beforeEach(() => {
    coverageDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(mockRecord),
      create: jest.fn().mockResolvedValue(mockRecord),
      update: jest.fn().mockResolvedValue(mockRecord),
    };
    individualDal = {
      get: jest.fn().mockResolvedValue({ id: 'ind-uuid' }),
    };
    payerConfigDal = {
      get: jest.fn().mockResolvedValue({ id: 'pc-uuid' }),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new IndividualPayerCoverageService(
      coverageDal as never,
      individualDal as never,
      payerConfigDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      individual_id: 'ind-uuid',
      payer_config_id: 'pc-uuid',
      subscriber_id: 'SUB-001',
      member_id: 'MEM-001',
      group_number: 'GRP-001',
      relationship: 'SELF',
      coverage_start: '2026-01-01',
      coverage_end: '2026-12-31',
      priority: 1,
    };

    it('should create an individual payer coverage', async () => {
      const result = await service.create(
        dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('cov-uuid');
      expect(coverageDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            individual_id: 'ind-uuid',
            payer_config_id: 'pc-uuid',
            subscriber_id: 'SUB-001',
            active: true,
          }) as unknown,
        }),
      );
    });

    it('should default optional fields when not provided', async () => {
      const minDto = {
        individual_id: 'ind-uuid',
        payer_config_id: 'pc-uuid',
        subscriber_id: 'SUB-001',
        coverage_start: '2026-01-01',
      };

      await service.create(
        minDto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(coverageDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            member_id: null,
            group_number: null,
            relationship: 'SELF',
            coverage_end: null,
            priority: 1,
          }) as unknown,
        }),
      );
    });

    it('should log audit action on create', async () => {
      await service.create(
        dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'COVERAGE_CREATED',
          action_type: 'CREATE',
          table_name: 'individual_payer_coverages',
          record_id: 'cov-uuid',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return record when found', async () => {
      const result = await service.findById('cov-uuid', 'org-uuid');
      expect(result.id).toBe('cov-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      coverageDal.get.mockResolvedValue(null);

      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated coverages', async () => {
      const result = await service.list('org-uuid');
      expect(result.payload).toHaveLength(1);
      expect(coverageDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            org_id: 'org-uuid',
          }) as unknown,
          paginationPayload: { page: 1, limit: 20 },
        }),
      );
    });
  });

  describe('listByIndividual', () => {
    it('should return coverages for a specific individual', async () => {
      const result = await service.listByIndividual('ind-uuid', 'org-uuid');
      expect(result.payload).toHaveLength(1);
      expect(coverageDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            individual_id: 'ind-uuid',
            org_id: 'org-uuid',
            active: true,
          }) as unknown,
        }),
      );
    });
  });

  describe('update', () => {
    const dto = { subscriber_id: 'SUB-002' };

    it('should update a coverage', async () => {
      const result = await service.update(
        'cov-uuid', dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('cov-uuid');
      expect(coverageDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            id: 'cov-uuid',
            org_id: 'org-uuid',
          }) as unknown,
          updatePayload: dto as unknown,
        }),
      );
    });

    it('should throw NotFoundException when record does not exist', async () => {
      coverageDal.get.mockResolvedValue(null);

      await expect(
        service.update('bad-id', dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit action on update', async () => {
      await service.update(
        'cov-uuid', dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'COVERAGE_UPDATED',
          action_type: 'UPDATE',
          table_name: 'individual_payer_coverages',
          record_id: 'cov-uuid',
        }),
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate a coverage', async () => {
      await service.deactivate(
        'cov-uuid', 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(coverageDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            active: false,
          }) as unknown,
        }),
      );
    });

    it('should log audit action on deactivate', async () => {
      await service.deactivate(
        'cov-uuid', 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'COVERAGE_DEACTIVATED',
          action_type: 'UPDATE',
          table_name: 'individual_payer_coverages',
        }),
      );
    });
  });

  describe('findCoverageForDate', () => {
    it('should return coverages matching the service date', async () => {
      coverageDal.find.mockResolvedValue({
        payload: [mockRecord],
      });

      const result = await service.findCoverageForDate('ind-uuid', '2026-06-15', 'org-uuid');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cov-uuid');
    });

    it('should return empty when no coverage matches date', async () => {
      coverageDal.find.mockResolvedValue({
        payload: [mockRecord],
      });

      const result = await service.findCoverageForDate('ind-uuid', '2027-06-15', 'org-uuid');
      expect(result).toHaveLength(0);
    });

    it('should handle coverage with no end date', async () => {
      coverageDal.find.mockResolvedValue({
        payload: [{ ...mockRecord, coverage_end: null }],
      });

      const result = await service.findCoverageForDate('ind-uuid', '2099-01-01', 'org-uuid');
      expect(result).toHaveLength(1);
    });
  });
});
