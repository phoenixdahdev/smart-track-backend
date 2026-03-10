import { NotFoundException } from '@nestjs/common';
import { ProgramService } from './program.service';

describe('ProgramService', () => {
  let service: ProgramService;
  let programDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockProgram = {
    id: 'prog-uuid',
    org_id: 'org-uuid',
    name: 'Residential Support',
    type: 'RESIDENTIAL',
    description: 'Desc',
    active: true,
  };

  beforeEach(() => {
    programDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockProgram],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockProgram),
      update: jest.fn().mockResolvedValue(mockProgram),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new ProgramService(programDal as never, auditLogService as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    it('should return programs for org', async () => {
      const result = await service.list('org-uuid');
      expect(programDal.find).toHaveBeenCalledWith(
        expect.objectContaining({ findOptions: { org_id: 'org-uuid' } }),
      );
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create program with org_id and log audit', async () => {
      const result = await service.create(
        { name: 'Residential Support', type: 'RESIDENTIAL' },
        'org-uuid',
        'user-uuid',
        'ADMIN',
        '127.0.0.1',
        'jest',
      );

      expect(programDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            name: 'Residential Support',
          }) as unknown,
        }),
      );
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PROGRAM_CREATED' }),
      );
      expect(result.id).toBe('prog-uuid');
    });
  });

  describe('findById', () => {
    it('should return program when found', async () => {
      programDal.get.mockResolvedValue(mockProgram);

      const result = await service.findById('prog-uuid', 'org-uuid');
      expect(result.name).toBe('Residential Support');
    });

    it('should throw NotFoundException when not found', async () => {
      programDal.get.mockResolvedValue(null);

      await expect(service.findById('bad-id', 'org-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update program and log audit', async () => {
      programDal.get.mockResolvedValue(mockProgram);

      await service.update(
        'prog-uuid',
        'org-uuid',
        { name: 'Community Living' },
        'user-uuid',
        'ADMIN',
        '127.0.0.1',
        'jest',
      );

      expect(programDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: { name: 'Community Living' },
        }),
      );
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PROGRAM_UPDATED' }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      programDal.get.mockResolvedValue(null);

      await expect(
        service.update('bad-id', 'org-uuid', { name: 'X' }, 'user-uuid', 'ADMIN', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
