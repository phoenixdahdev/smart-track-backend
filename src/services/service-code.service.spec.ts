import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServiceCodeService } from './service-code.service';

describe('ServiceCodeService', () => {
  let service: ServiceCodeService;
  let serviceCodeDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let globalServiceCodeDal: { get: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockRecord = {
    id: 'sc-uuid',
    org_id: 'org-uuid',
    global_code_id: 'gc-uuid',
    code: 'H2015',
    description: 'Community support',
    modifiers: ['HM'],
    unit_of_measure: '15MIN',
    active: true,
  };

  const mockGlobalCode = {
    id: 'gc-uuid',
    code: 'H2015',
    description: 'Comprehensive community support services',
    billing_unit: '15MIN',
    active: true,
  };

  beforeEach(() => {
    serviceCodeDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(mockRecord),
      create: jest.fn().mockResolvedValue(mockRecord),
      update: jest.fn().mockResolvedValue(mockRecord),
    };
    globalServiceCodeDal = {
      get: jest.fn().mockResolvedValue(mockGlobalCode),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new ServiceCodeService(
      serviceCodeDal as never,
      globalServiceCodeDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      global_code_id: 'gc-uuid',
      code: 'H2015',
      description: 'Community support',
      modifiers: ['HM'],
      unit_of_measure: '15MIN',
    };

    it('should validate global code exists', async () => {
      globalServiceCodeDal.get.mockResolvedValue(null);

      await expect(
        service.create(dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a service code and copy code/description from global', async () => {
      const noCodeDto = { global_code_id: 'gc-uuid' };

      await service.create(noCodeDto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest');

      expect(serviceCodeDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            code: 'H2015',
            description: 'Comprehensive community support services',
            unit_of_measure: '15MIN',
            org_id: 'org-uuid',
            active: true,
          }) as unknown,
        }),
      );
    });

    it('should use dto code/description when provided', async () => {
      await service.create(dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest');

      expect(serviceCodeDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            code: 'H2015',
            description: 'Community support',
          }) as unknown,
        }),
      );
    });

    it('should log audit action on create', async () => {
      await service.create(dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SERVICE_CODE_CREATED',
          action_type: 'CREATE',
          table_name: 'service_codes',
          record_id: 'sc-uuid',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return record when found', async () => {
      const result = await service.findById('sc-uuid', 'org-uuid');
      expect(result.id).toBe('sc-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      serviceCodeDal.get.mockResolvedValue(null);

      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated service codes', async () => {
      const result = await service.list('org-uuid');
      expect(result.payload).toHaveLength(1);
      expect(serviceCodeDal.find).toHaveBeenCalledWith(
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
    const dto = { description: 'Updated description' };

    it('should update a service code', async () => {
      const result = await service.update(
        'sc-uuid', dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('sc-uuid');
      expect(serviceCodeDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            id: 'sc-uuid',
            org_id: 'org-uuid',
          }) as unknown,
          updatePayload: dto as unknown,
        }),
      );
    });

    it('should throw NotFoundException when record does not exist', async () => {
      serviceCodeDal.get.mockResolvedValue(null);

      await expect(
        service.update('bad-id', dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit action on update', async () => {
      await service.update(
        'sc-uuid', dto as never, 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SERVICE_CODE_UPDATED',
          action_type: 'UPDATE',
          table_name: 'service_codes',
          record_id: 'sc-uuid',
        }),
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate a service code', async () => {
      await service.deactivate(
        'sc-uuid', 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(serviceCodeDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            active: false,
          }) as unknown,
        }),
      );
    });

    it('should log audit action on deactivate', async () => {
      await service.deactivate(
        'sc-uuid', 'org-uuid', 'user-uuid', 'ADMIN', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SERVICE_CODE_DEACTIVATED',
          action_type: 'UPDATE',
          table_name: 'service_codes',
        }),
      );
    });
  });
});
