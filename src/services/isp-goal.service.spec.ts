import { NotFoundException } from '@nestjs/common';
import { IspGoalService } from './isp-goal.service';

const mockEncrypt = jest.fn((v: string) => `ENC(${v})`);
const mockDecrypt = jest.fn((v: string) => v.replace(/^ENC\((.+)\)$/, '$1'));

describe('IspGoalService', () => {
  let service: IspGoalService;
  let ispGoalDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let encryptionService: { encrypt: jest.Mock; decrypt: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockGoal = {
    id: 'goal-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    description: 'ENC(Improve daily living skills)',
    target: '80%',
    effective_start: '2026-03-01',
    effective_end: null,
    active: true,
  };

  beforeEach(() => {
    ispGoalDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockGoal],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockGoal),
      update: jest.fn().mockResolvedValue(mockGoal),
    };
    encryptionService = { encrypt: mockEncrypt, decrypt: mockDecrypt };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new IspGoalService(
      ispGoalDal as never,
      encryptionService as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should encrypt description and create goal', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        description: 'Improve daily living skills',
        effective_start: '2026-03-01',
      };

      await service.create(dto, 'org-uuid', 'clinician-uuid', 'CLINICIAN', '127.0.0.1', 'jest');

      expect(mockEncrypt).toHaveBeenCalledWith('Improve daily living skills');
      expect(ispGoalDal.create).toHaveBeenCalled();
    });

    it('should log audit action', async () => {
      await service.create(
        { individual_id: 'ind-uuid', description: 'test', effective_start: '2026-03-01' },
        'org-uuid',
        'clinician-uuid',
        'CLINICIAN',
        '127.0.0.1',
        'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ISP_GOAL_CREATED' }),
      );
    });
  });

  describe('listByIndividual', () => {
    it('should return decrypted goals', async () => {
      const result = await service.listByIndividual('ind-uuid', 'org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(mockDecrypt).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return decrypted goal when found', async () => {
      ispGoalDal.get.mockResolvedValue(mockGoal);

      const result = await service.findById(
        'goal-uuid',
        'org-uuid',
        'clinician-uuid',
        'CLINICIAN',
        '127.0.0.1',
        'jest',
      );

      expect(result.id).toBe('goal-uuid');
      expect(mockDecrypt).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(
        service.findById('bad-id', 'org-uuid', 'clinician-uuid', 'CLINICIAN', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should encrypt updated description', async () => {
      ispGoalDal.get.mockResolvedValue(mockGoal);

      await service.update(
        'goal-uuid',
        'org-uuid',
        { description: 'Updated goal' },
        'clinician-uuid',
        'CLINICIAN',
        '127.0.0.1',
        'jest',
      );

      expect(mockEncrypt).toHaveBeenCalledWith('Updated goal');
    });
  });
});
