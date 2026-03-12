import { NotFoundException } from '@nestjs/common';
import { BehaviorPlanService } from './behavior-plan.service';

const mockEncrypt = jest.fn((v: string) => `ENC(${v})`);
const mockDecrypt = jest.fn((v: string) => v.replace(/^ENC\((.+)\)$/, '$1'));

describe('BehaviorPlanService', () => {
  let service: BehaviorPlanService;
  let behaviorPlanDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let encryptionService: { encrypt: jest.Mock; decrypt: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockPlan = {
    id: 'bp-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    clinician_id: 'clinician-uuid',
    version: 1,
    content: 'ENC(Plan content)',
    effective_date: '2026-03-01',
    end_date: null,
    active: true,
  };

  beforeEach(() => {
    behaviorPlanDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockPlan],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockPlan),
      update: jest.fn().mockResolvedValue(mockPlan),
    };
    encryptionService = { encrypt: mockEncrypt, decrypt: mockDecrypt };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new BehaviorPlanService(
      behaviorPlanDal as never,
      encryptionService as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should encrypt content and create plan', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        content: 'Plan content',
        effective_date: '2026-03-01',
      };

      await service.create(dto, 'org-uuid', 'clinician-uuid', 'CLINICIAN', '127.0.0.1', 'jest');

      expect(mockEncrypt).toHaveBeenCalledWith('Plan content');
      expect(behaviorPlanDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({ version: 1 }) as unknown,
        }),
      );
    });
  });

  describe('createNewVersion', () => {
    it('should deactivate current plan and create new version', async () => {
      behaviorPlanDal.get.mockResolvedValue(mockPlan);

      const dto = {
        individual_id: 'ind-uuid',
        content: 'Updated plan',
        effective_date: '2026-06-01',
      };

      await service.createNewVersion(
        'ind-uuid',
        'org-uuid',
        dto,
        'clinician-uuid',
        'CLINICIAN',
        '127.0.0.1',
        'jest',
      );

      expect(behaviorPlanDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({ active: false }) as unknown,
        }),
      );
      expect(behaviorPlanDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({ version: 2 }) as unknown,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return decrypted plan when found', async () => {
      behaviorPlanDal.get.mockResolvedValue(mockPlan);

      const result = await service.findById(
        'bp-uuid',
        'org-uuid',
        'clinician-uuid',
        'CLINICIAN',
        '127.0.0.1',
        'jest',
      );

      expect(result.id).toBe('bp-uuid');
      expect(mockDecrypt).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(
        service.findById('bad-id', 'org-uuid', 'clinician-uuid', 'CLINICIAN', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listByIndividual', () => {
    it('should return decrypted plans', async () => {
      const result = await service.listByIndividual('ind-uuid', 'org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(mockDecrypt).toHaveBeenCalled();
    });
  });
});
