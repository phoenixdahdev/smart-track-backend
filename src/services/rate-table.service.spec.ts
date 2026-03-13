import { NotFoundException } from '@nestjs/common';
import { RateTableService } from './rate-table.service';

describe('RateTableService', () => {
  let service: RateTableService;
  let rateTableDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let payerConfigDal: { get: jest.Mock };
  let serviceCodeDal: { get: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockRecord = {
    id: 'rt-uuid',
    org_id: 'org-uuid',
    payer_config_id: 'pc-uuid',
    service_code_id: 'sc-uuid',
    rate_cents: 5000,
    effective_date: '2026-01-01',
    end_date: '2026-12-31',
    active: true,
  };

  beforeEach(() => {
    rateTableDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(mockRecord),
      create: jest.fn().mockResolvedValue(mockRecord),
      update: jest.fn().mockResolvedValue(mockRecord),
    };
    payerConfigDal = {
      get: jest.fn().mockResolvedValue({ id: 'pc-uuid' }),
    };
    serviceCodeDal = {
      get: jest.fn().mockResolvedValue({ id: 'sc-uuid' }),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new RateTableService(
      rateTableDal as never,
      payerConfigDal as never,
      serviceCodeDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      payer_config_id: 'pc-uuid',
      service_code_id: 'sc-uuid',
      rate_cents: 5000,
      effective_date: '2026-01-01',
      end_date: '2026-12-31',
    };

    it('should create a rate table entry', async () => {
      const result = await service.create(
        dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('rt-uuid');
      expect(rateTableDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            payer_config_id: 'pc-uuid',
            service_code_id: 'sc-uuid',
            rate_cents: 5000,
            effective_date: '2026-01-01',
            active: true,
          }) as unknown,
        }),
      );
    });

    it('should set end_date to null when not provided', async () => {
      const noEndDto = { ...dto, end_date: undefined };

      await service.create(
        noEndDto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(rateTableDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            end_date: null,
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
          action: 'RATE_TABLE_CREATED',
          action_type: 'CREATE',
          table_name: 'rate_tables',
          record_id: 'rt-uuid',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return record when found', async () => {
      const result = await service.findById('rt-uuid', 'org-uuid');
      expect(result.id).toBe('rt-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      rateTableDal.get.mockResolvedValue(null);

      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated rate tables', async () => {
      const result = await service.list('org-uuid');
      expect(result.payload).toHaveLength(1);
      expect(rateTableDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            org_id: 'org-uuid',
          }) as unknown,
          paginationPayload: { page: 1, limit: 20 },
        }),
      );
    });
  });

  describe('update', () => {
    const dto = { rate_cents: 6000 };

    it('should update a rate table entry', async () => {
      const result = await service.update(
        'rt-uuid', dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('rt-uuid');
      expect(rateTableDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            id: 'rt-uuid',
            org_id: 'org-uuid',
          }) as unknown,
        }),
      );
    });

    it('should throw NotFoundException when record does not exist', async () => {
      rateTableDal.get.mockResolvedValue(null);

      await expect(
        service.update('bad-id', dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit action on update', async () => {
      await service.update(
        'rt-uuid', dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RATE_TABLE_UPDATED',
          action_type: 'UPDATE',
          table_name: 'rate_tables',
          record_id: 'rt-uuid',
        }),
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate a rate table entry', async () => {
      await service.deactivate(
        'rt-uuid', 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(rateTableDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            active: false,
          }) as unknown,
        }),
      );
    });

    it('should log audit action on deactivate', async () => {
      await service.deactivate(
        'rt-uuid', 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RATE_TABLE_DEACTIVATED',
          action_type: 'UPDATE',
          table_name: 'rate_tables',
        }),
      );
    });
  });

  describe('findRate', () => {
    it('should return matching rate for service date within range', async () => {
      rateTableDal.find.mockResolvedValue({
        payload: [mockRecord],
      });

      const result = await service.findRate('pc-uuid', 'sc-uuid', '2026-06-15', 'org-uuid');
      expect(result).toBeDefined();
      expect(result!.id).toBe('rt-uuid');
    });

    it('should return null when no matching rate found', async () => {
      rateTableDal.find.mockResolvedValue({ payload: [] });

      const result = await service.findRate('pc-uuid', 'sc-uuid', '2026-06-15', 'org-uuid');
      expect(result).toBeNull();
    });

    it('should match date range correctly', async () => {
      const rateInRange = {
        ...mockRecord,
        effective_date: '2026-01-01',
        end_date: '2026-06-30',
      };
      const rateOutRange = {
        ...mockRecord,
        id: 'rt-uuid-2',
        effective_date: '2026-07-01',
        end_date: '2026-12-31',
      };
      rateTableDal.find.mockResolvedValue({
        payload: [rateOutRange, rateInRange],
      });

      const result = await service.findRate('pc-uuid', 'sc-uuid', '2026-03-15', 'org-uuid');
      expect(result).toBeDefined();
      expect(result!.effective_date).toBe('2026-01-01');
    });

    it('should handle rate with no end_date', async () => {
      const openEndedRate = { ...mockRecord, end_date: null };
      rateTableDal.find.mockResolvedValue({
        payload: [openEndedRate],
      });

      const result = await service.findRate('pc-uuid', 'sc-uuid', '2099-01-01', 'org-uuid');
      expect(result).toBeDefined();
      expect(result!.id).toBe('rt-uuid');
    });
  });
});
