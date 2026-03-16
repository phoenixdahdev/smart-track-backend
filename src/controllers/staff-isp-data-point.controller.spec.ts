import { StaffIspDataPointController } from './staff-isp-data-point.controller';

describe('StaffIspDataPointController', () => {
  let controller: StaffIspDataPointController;
  let ispDataPointService: {
    create: jest.Mock;
    listByGoal: jest.Mock;
    listByServiceRecord: jest.Mock;
  };

  const mockDataPoint = { id: 'dp-uuid', value: '75' };
  const mockCurrentUser = {
    id: 'staff-uuid',
    org_id: 'org-uuid',
    role: 'DSP',
    email: 'dsp@test.com',
    name: 'DSP',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };
  const mockReq = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    ispDataPointService = {
      create: jest.fn().mockResolvedValue(mockDataPoint),
      listByGoal: jest.fn().mockResolvedValue({
        payload: [mockDataPoint],
        paginationMeta: { total: 1 },
      }),
      listByServiceRecord: jest.fn().mockResolvedValue({
        payload: [mockDataPoint],
        paginationMeta: { total: 1 },
      }),
    };

    controller = new StaffIspDataPointController(ispDataPointService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /staff/isp-data-points', () => {
    it('should record a data point', async () => {
      const dto = { goal_id: 'goal-uuid', value: '75' };
      const result = await controller.create(dto, mockCurrentUser as never, mockReq as never);

      expect(result.message).toBe('ISP data point recorded');
    });
  });

  describe('GET /staff/isp-data-points/by-goal/:goalId', () => {
    it('should list data points by goal', async () => {
      const result = await controller.listByGoal('goal-uuid', 'org-uuid', {} as never);

      expect(result.data).toHaveLength(1);
    });
  });
});
