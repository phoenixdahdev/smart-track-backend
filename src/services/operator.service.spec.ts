import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OperatorService } from './operator.service';
import { PlatformRole } from '@enums/role.enum';

describe('OperatorService', () => {
  let service: OperatorService;
  let operatorDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let auditLogService: { logPlatformAction: jest.Mock };

  const mockOperator = {
    id: 'op-uuid',
    email: 'admin@smarttrack.com',
    name: 'Admin User',
    role: PlatformRole.PLATFORM_ADMIN,
    active: true,
  };

  beforeEach(() => {
    operatorDal = {
      get: jest.fn().mockResolvedValue(mockOperator),
      find: jest.fn().mockResolvedValue({
        payload: [mockOperator],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockOperator),
      update: jest.fn().mockResolvedValue(mockOperator),
    };
    auditLogService = { logPlatformAction: jest.fn().mockResolvedValue(undefined) };

    service = new OperatorService(operatorDal as never, auditLogService as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an operator and audit log', async () => {
      const dto = { email: 'new@smarttrack.com', name: 'New Op', role: PlatformRole.PLATFORM_ADMIN };

      const result = await service.create(dto, 'creator-uuid', '127.0.0.1', 'jest');

      expect(result.id).toBe('op-uuid');
      expect(operatorDal.create).toHaveBeenCalled();
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'OPERATOR_CREATED' }),
      );
    });
  });

  describe('findById', () => {
    it('should return an operator when found', async () => {
      const result = await service.findById('op-uuid');
      expect(result.id).toBe('op-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      operatorDal.get.mockResolvedValue(null);
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated operators', async () => {
      const result = await service.list();
      expect(result.payload).toHaveLength(1);
    });

    it('should apply role filter', async () => {
      await service.list(undefined, { role: PlatformRole.PLATFORM_ADMIN });

      expect(operatorDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ role: PlatformRole.PLATFORM_ADMIN }) as unknown,
        }),
      );
    });

    it('should apply active filter', async () => {
      await service.list(undefined, { active: true });

      expect(operatorDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ active: true }) as unknown,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update an operator and audit log', async () => {
      const dto = { name: 'Updated Name' };

      await service.update('op-uuid', dto, 'updater-uuid', '127.0.0.1', 'jest');

      expect(operatorDal.update).toHaveBeenCalled();
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'OPERATOR_UPDATED' }),
      );
    });

    it('should throw NotFoundException when operator not found', async () => {
      operatorDal.get.mockResolvedValue(null);

      await expect(
        service.update('bad-id', { name: 'X' }, 'op-uuid', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an operator', async () => {
      await service.deactivate('op-uuid', 'other-uuid', '127.0.0.1', 'jest');

      expect(operatorDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({ active: false }) as unknown,
        }),
      );
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'OPERATOR_DEACTIVATED' }),
      );
    });

    it('should throw BadRequestException when deactivating PLATFORM_OWNER by others', async () => {
      operatorDal.get.mockResolvedValue({
        ...mockOperator,
        role: PlatformRole.PLATFORM_OWNER,
      });

      await expect(
        service.deactivate('op-uuid', 'other-uuid', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
