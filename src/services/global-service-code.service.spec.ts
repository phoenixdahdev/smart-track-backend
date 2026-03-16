import { NotFoundException } from '@nestjs/common';
import { GlobalServiceCodeService } from './global-service-code.service';

describe('GlobalServiceCodeService', () => {
  let service: GlobalServiceCodeService;
  let codeDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let auditLogService: { logPlatformAction: jest.Mock };

  const mockCode = {
    id: 'code-uuid',
    code: 'H2015',
    description: 'Community living support',
    code_type: 'HCPCS',
    valid_states: ['IL', 'OH'],
    billing_unit: '15MIN',
    status: 'ACTIVE',
    created_by: 'op-uuid',
  };

  beforeEach(() => {
    codeDal = {
      get: jest.fn().mockResolvedValue(mockCode),
      find: jest.fn().mockResolvedValue({ payload: [mockCode], paginationMeta: { total: 1 } }),
      create: jest.fn().mockResolvedValue(mockCode),
      update: jest.fn().mockResolvedValue(mockCode),
    };
    auditLogService = { logPlatformAction: jest.fn().mockResolvedValue(undefined) };

    service = new GlobalServiceCodeService(codeDal as never, auditLogService as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a global service code', async () => {
      const dto = {
        code: 'H2015',
        description: 'Community living support',
        code_type: 'HCPCS',
        valid_states: ['IL'],
        billing_unit: '15MIN',
      };

      const result = await service.create(dto, 'op-uuid', '127.0.0.1', 'jest');

      expect(result.code).toBe('H2015');
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'GLOBAL_SERVICE_CODE_CREATED' }),
      );
    });
  });

  describe('findById', () => {
    it('should return a code when found', async () => {
      const result = await service.findById('code-uuid');
      expect(result.code).toBe('H2015');
    });

    it('should throw NotFoundException when not found', async () => {
      codeDal.get.mockResolvedValue(null);
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated codes', async () => {
      const result = await service.list();
      expect(result.payload).toHaveLength(1);
    });

    it('should apply code_type filter', async () => {
      await service.list(undefined, { code_type: 'HCPCS' });

      expect(codeDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ code_type: 'HCPCS' }) as unknown,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a code and audit log', async () => {
      await service.update('code-uuid', { description: 'Updated desc' }, 'op-uuid', '127.0.0.1', 'jest');

      expect(codeDal.update).toHaveBeenCalled();
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'GLOBAL_SERVICE_CODE_UPDATED' }),
      );
    });
  });

  describe('deprecate', () => {
    it('should deprecate a code', async () => {
      await service.deprecate('code-uuid', 'op-uuid', '127.0.0.1', 'jest');

      expect(codeDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: 'DEPRECATED',
            deprecated_at: expect.any(Date) as unknown,
          }) as unknown,
        }),
      );
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'GLOBAL_SERVICE_CODE_DEPRECATED' }),
      );
    });
  });
});
