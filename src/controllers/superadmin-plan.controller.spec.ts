import { SuperadminPlanController } from './superadmin-plan.controller';
import { PlatformRole } from '@enums/role.enum';

describe('SuperadminPlanController', () => {
  let controller: SuperadminPlanController;
  let subscriptionService: {
    createPlan: jest.Mock;
    getPlan: jest.Mock;
    listPlans: jest.Mock;
    updatePlan: jest.Mock;
  };

  const mockPlan = {
    id: 'plan-uuid',
    tier_name: 'STARTER',
    price_cents_monthly: 9900,
    active: true,
  };

  const mockCurrentUser = {
    id: 'op-uuid',
    role: PlatformRole.PLATFORM_ADMIN,
    org_id: null,
    email: 'admin@smarttrack.com',
    name: 'Admin',
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
    subscriptionService = {
      createPlan: jest.fn().mockResolvedValue(mockPlan),
      getPlan: jest.fn().mockResolvedValue(mockPlan),
      listPlans: jest.fn().mockResolvedValue({ payload: [mockPlan] }),
      updatePlan: jest.fn().mockResolvedValue(mockPlan),
    };

    controller = new SuperadminPlanController(subscriptionService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /superadmin/platform/plans', () => {
    it('should create a plan', async () => {
      const dto = {
        tier_name: 'STARTER',
        max_individuals: 100,
        max_users: 20,
        storage_gb: 10,
        api_calls_monthly: 10000,
        modules_included: ['billing'],
        price_cents_monthly: 9900,
      };

      const result = await controller.create(dto, mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Plan created');
    });
  });

  describe('GET /superadmin/platform/plans', () => {
    it('should list plans', async () => {
      const result = await controller.list();
      expect(result.message).toBe('Plans retrieved');
    });
  });

  describe('GET /superadmin/platform/plans/:id', () => {
    it('should get plan by ID', async () => {
      const result = await controller.findById('plan-uuid');
      expect(result.message).toBe('Plan retrieved');
    });
  });

  describe('PATCH /superadmin/platform/plans/:id', () => {
    it('should update a plan', async () => {
      const result = await controller.update(
        'plan-uuid', { price_cents_monthly: 14900 }, mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Plan updated');
    });
  });
});
