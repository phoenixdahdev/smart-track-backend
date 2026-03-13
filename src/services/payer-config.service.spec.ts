import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PayerConfigService } from './payer-config.service';

describe('PayerConfigService', () => {
  let service: PayerConfigService;
  let payerConfigDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let globalPayerDal: { get: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockRecord = {
    id: 'pc-uuid',
    org_id: 'org-uuid',
    global_payer_id: 'gp-uuid',
    payer_name: 'Test Payer',
    payer_id_edi: 'EDI001',
    clearinghouse_routing: {},
    config: {},
    active: true,
  };

  const mockGlobalPayer = {
    id: 'gp-uuid',
    payer_name: 'Global Payer',
    payer_id_edi: 'GEDI001',
    active: true,
  };

  beforeEach(() => {
    payerConfigDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(mockRecord),
      create: jest.fn().mockResolvedValue(mockRecord),
      update: jest.fn().mockResolvedValue(mockRecord),
    };
    globalPayerDal = {
      get: jest.fn().mockResolvedValue(mockGlobalPayer),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new PayerConfigService(
      payerConfigDal as never,
      globalPayerDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      global_payer_id: 'gp-uuid',
      payer_name: 'Test Payer',
      payer_id_edi: 'EDI001',
      clearinghouse_routing: {},
      config: {},
    };

    it('should validate global payer exists', async () => {
      globalPayerDal.get.mockResolvedValue(null);

      await expect(
        service.create(dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a payer config and copy name/edi from global payer', async () => {
      const noNameDto = { global_payer_id: 'gp-uuid' };

      await service.create(noNameDto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest');

      expect(payerConfigDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            payer_name: 'Global Payer',
            payer_id_edi: 'GEDI001',
            org_id: 'org-uuid',
            active: true,
          }) as unknown,
        }),
      );
    });

    it('should use dto name/edi when provided', async () => {
      await service.create(dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest');

      expect(payerConfigDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            payer_name: 'Test Payer',
            payer_id_edi: 'EDI001',
          }) as unknown,
        }),
      );
    });

    it('should log audit action on create', async () => {
      await service.create(dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYER_CONFIG_CREATED',
          action_type: 'CREATE',
          table_name: 'payer_config',
          record_id: 'pc-uuid',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return record when found', async () => {
      const result = await service.findById('pc-uuid', 'org-uuid');
      expect(result.id).toBe('pc-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      payerConfigDal.get.mockResolvedValue(null);

      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated payer configs', async () => {
      const result = await service.list('org-uuid');
      expect(result.payload).toHaveLength(1);
      expect(payerConfigDal.find).toHaveBeenCalledWith(
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
    const dto = { payer_name: 'Updated Payer' };

    it('should update a payer config', async () => {
      const result = await service.update(
        'pc-uuid', dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('pc-uuid');
      expect(payerConfigDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            id: 'pc-uuid',
            org_id: 'org-uuid',
          }) as unknown,
          updatePayload: dto as unknown,
        }),
      );
    });

    it('should throw NotFoundException when record does not exist', async () => {
      payerConfigDal.get.mockResolvedValue(null);

      await expect(
        service.update('bad-id', dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit action on update', async () => {
      await service.update(
        'pc-uuid', dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYER_CONFIG_UPDATED',
          action_type: 'UPDATE',
          table_name: 'payer_config',
          record_id: 'pc-uuid',
        }),
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate a payer config', async () => {
      await service.deactivate(
        'pc-uuid', 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(payerConfigDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            active: false,
          }) as unknown,
        }),
      );
    });

    it('should log audit action on deactivate', async () => {
      await service.deactivate(
        'pc-uuid', 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYER_CONFIG_DEACTIVATED',
          action_type: 'UPDATE',
          table_name: 'payer_config',
        }),
      );
    });
  });
});
