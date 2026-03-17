import { PortalIspController } from './portal-isp.controller';

describe('PortalIspController', () => {
  let controller: PortalIspController;
  let guardianPortalService: {
    getIspGoals: jest.Mock;
    getIspGoalProgress: jest.Mock;
  };

  const mockCurrentUser = {
    id: 'guardian-uuid',
    org_id: 'org-uuid',
    role: 'GUARDIAN',
    email: 'guardian@test.com',
    name: 'Guardian User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  const mockGoal = {
    id: 'goal-uuid',
    description: 'Improve social skills',
    target: '80%',
    effective_start: '2026-01-01',
    effective_end: null,
    active: true,
    data_point_count: 5,
  };

  const mockDataPoint = {
    id: 'dp-uuid',
    value: '75',
    recorded_at: new Date(),
  };

  beforeEach(() => {
    guardianPortalService = {
      getIspGoals: jest.fn().mockResolvedValue({
        payload: [mockGoal],
        paginationMeta: { total: 1 },
      }),
      getIspGoalProgress: jest.fn().mockResolvedValue({
        payload: [mockDataPoint],
        paginationMeta: { total: 1 },
      }),
    };

    controller = new PortalIspController(guardianPortalService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /portal/individuals/:id/isp/goals', () => {
    it('should list ISP goals', async () => {
      const result = await controller.listGoals('ind-uuid', mockCurrentUser as never, {});
      expect(result.message).toBe('ISP goals retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /portal/individuals/:id/isp/goals/:goalId/progress', () => {
    it('should return goal progress', async () => {
      const result = await controller.goalProgress(
        'ind-uuid', 'goal-uuid', mockCurrentUser as never, {},
      );
      expect(result.message).toBe('Goal progress retrieved');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('recorded_by');
    });
  });
});
