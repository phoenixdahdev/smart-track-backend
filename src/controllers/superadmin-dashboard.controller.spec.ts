import { SuperadminDashboardController } from './superadmin-dashboard.controller';

describe('SuperadminDashboardController', () => {
  let controller: SuperadminDashboardController;
  let orgDal: { find: jest.Mock };
  let applicationDal: { find: jest.Mock };
  let subscriptionDal: { find: jest.Mock };

  beforeEach(() => {
    orgDal = {
      find: jest.fn().mockResolvedValue({
        payload: [],
        paginationMeta: { total: 5 },
      }),
    };
    applicationDal = {
      find: jest.fn().mockResolvedValue({
        payload: [],
        paginationMeta: { total: 3 },
      }),
    };
    subscriptionDal = {
      find: jest.fn().mockResolvedValue({
        payload: [],
        paginationMeta: { total: 4 },
      }),
    };

    controller = new SuperadminDashboardController(
      orgDal as never,
      applicationDal as never,
      subscriptionDal as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /superadmin/platform/health', () => {
    it('should return platform dashboard data', async () => {
      const result = await controller.dashboard();

      expect(result.message).toBe('Platform dashboard retrieved');
      expect(result.data.active_agencies).toBe(5);
      expect(result.data.pending_applications).toBe(3);
      expect(result.data.active_subscriptions).toBe(4);
      expect(result.data.agencies_by_status).toBeDefined();
      expect(result.data.applications_by_status).toBeDefined();
    });
  });
});
