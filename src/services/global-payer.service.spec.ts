import { NotFoundException } from '@nestjs/common';
import { GlobalPayerService } from './global-payer.service';

describe('GlobalPayerService', () => {
  let service: GlobalPayerService;
  let payerDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let auditLogService: { logPlatformAction: jest.Mock };

  const mockPayer = {
    id: 'payer-uuid',
    payer_name: 'Aetna',
    payer_id_edi: 'AETNA001',
    state: 'IL',
    active: true,
  };

  beforeEach(() => {
    payerDal = {
      get: jest.fn().mockResolvedValue(mockPayer),
      find: jest.fn().mockResolvedValue({ payload: [mockPayer], paginationMeta: { total: 1 } }),
      create: jest.fn().mockResolvedValue(mockPayer),
      update: jest.fn().mockResolvedValue(mockPayer),
    };
    auditLogService = { logPlatformAction: jest.fn().mockResolvedValue(undefined) };

    service = new GlobalPayerService(payerDal as never, auditLogService as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a global payer', async () => {
      const dto = { payer_name: 'Aetna', payer_id_edi: 'AETNA001' };

      const result = await service.create(dto, 'op-uuid', '127.0.0.1', 'jest');

      expect(result.payer_name).toBe('Aetna');
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'GLOBAL_PAYER_CREATED' }),
      );
    });
  });

  describe('findById', () => {
    it('should return a payer when found', async () => {
      const result = await service.findById('payer-uuid');
      expect(result.payer_name).toBe('Aetna');
    });

    it('should throw NotFoundException when not found', async () => {
      payerDal.get.mockResolvedValue(null);
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated payers', async () => {
      const result = await service.list();
      expect(result.payload).toHaveLength(1);
    });

    it('should apply state filter', async () => {
      await service.list(undefined, { state: 'IL' });

      expect(payerDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ state: 'IL' }) as unknown,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a payer', async () => {
      await service.update('payer-uuid', { payer_name: 'Updated' }, 'op-uuid', '127.0.0.1', 'jest');

      expect(payerDal.update).toHaveBeenCalled();
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'GLOBAL_PAYER_UPDATED' }),
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate a payer', async () => {
      await service.deactivate('payer-uuid', 'op-uuid', '127.0.0.1', 'jest');

      expect(payerDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({ active: false }) as unknown,
        }),
      );
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'GLOBAL_PAYER_DEACTIVATED' }),
      );
    });
  });
});
