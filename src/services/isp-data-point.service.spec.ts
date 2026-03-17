import { NotFoundException } from '@nestjs/common';
import { IspDataPointService } from './isp-data-point.service';

describe('IspDataPointService', () => {
  let service: IspDataPointService;
  let ispDataPointDal: { find: jest.Mock; create: jest.Mock };
  let ispGoalDal: { get: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };
  let notificationTriggerService: { onIspGoalProgressUpdated: jest.Mock };

  const mockGoal = { id: 'goal-uuid', org_id: 'org-uuid', individual_id: 'ind-uuid', active: true };
  const mockDataPoint = {
    id: 'dp-uuid',
    org_id: 'org-uuid',
    goal_id: 'goal-uuid',
    service_record_id: null,
    value: '75',
    recorded_at: new Date(),
    recorded_by: 'staff-uuid',
  };

  beforeEach(() => {
    ispDataPointDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockDataPoint],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockDataPoint),
    };
    ispGoalDal = {
      get: jest.fn().mockResolvedValue(mockGoal),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };
    notificationTriggerService = {
      onIspGoalProgressUpdated: jest.fn().mockResolvedValue(undefined),
    };

    service = new IspDataPointService(
      ispDataPointDal as never,
      ispGoalDal as never,
      auditLogService as never,
      notificationTriggerService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a data point and validate goal exists', async () => {
      const dto = { goal_id: 'goal-uuid', value: '75' };

      const result = await service.create(
        dto,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(ispGoalDal.get).toHaveBeenCalled();
      expect(result.id).toBe('dp-uuid');
    });

    it('should throw if goal not found', async () => {
      ispGoalDal.get.mockResolvedValue(null);

      await expect(
        service.create(
          { goal_id: 'bad-id', value: '75' },
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit action', async () => {
      await service.create(
        { goal_id: 'goal-uuid', value: '75' },
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ISP_DATA_POINT_CREATED' }),
      );
    });
  });

  describe('listByGoal', () => {
    it('should return data points for a goal', async () => {
      const result = await service.listByGoal('goal-uuid', 'org-uuid');
      expect(result.payload).toHaveLength(1);
    });
  });
});
