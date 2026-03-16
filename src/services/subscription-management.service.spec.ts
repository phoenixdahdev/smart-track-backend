import { NotFoundException } from '@nestjs/common';
import { SubscriptionManagementService } from './subscription-management.service';

describe('SubscriptionManagementService', () => {
  let service: SubscriptionManagementService;
  let planDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let subscriptionDal: { get: jest.Mock; update: jest.Mock };
  let invoiceDal: { find: jest.Mock; create: jest.Mock };
  let auditLogService: { logPlatformAction: jest.Mock };

  const mockPlan = {
    id: 'plan-uuid',
    tier_name: 'STARTER',
    max_individuals: 100,
    max_users: 20,
    storage_gb: 10,
    api_calls_monthly: 10000,
    modules_included: ['billing'],
    price_cents_monthly: 9900,
    active: true,
  };

  const mockSubscription = {
    id: 'sub-uuid',
    org_id: 'org-uuid',
    plan_tier: 'STARTER',
    status: 'ACTIVE',
    billing_cycle: 'MONTHLY',
    mrr_cents: 9900,
  };

  const mockInvoice = {
    id: 'inv-uuid',
    org_id: 'org-uuid',
    subscription_id: 'sub-uuid',
    amount_cents: 9900,
    status: 'DRAFT',
    due_date: '2026-04-01',
  };

  beforeEach(() => {
    planDal = {
      get: jest.fn().mockResolvedValue(mockPlan),
      find: jest.fn().mockResolvedValue({ payload: [mockPlan], paginationMeta: { total: 1 } }),
      create: jest.fn().mockResolvedValue(mockPlan),
      update: jest.fn().mockResolvedValue(mockPlan),
    };
    subscriptionDal = {
      get: jest.fn().mockResolvedValue(mockSubscription),
      update: jest.fn().mockResolvedValue(mockSubscription),
    };
    invoiceDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockInvoice], paginationMeta: { total: 1 } }),
      create: jest.fn().mockResolvedValue(mockInvoice),
    };
    auditLogService = { logPlatformAction: jest.fn().mockResolvedValue(undefined) };

    service = new SubscriptionManagementService(
      planDal as never,
      subscriptionDal as never,
      invoiceDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPlan', () => {
    it('should create a plan definition', async () => {
      const dto = {
        tier_name: 'STARTER',
        max_individuals: 100,
        max_users: 20,
        storage_gb: 10,
        api_calls_monthly: 10000,
        modules_included: ['billing'],
        price_cents_monthly: 9900,
      };

      const result = await service.createPlan(dto, 'op-uuid', '127.0.0.1', 'jest');

      expect(result.tier_name).toBe('STARTER');
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PLAN_CREATED' }),
      );
    });
  });

  describe('updatePlan', () => {
    it('should update a plan', async () => {
      await service.updatePlan('plan-uuid', { price_cents_monthly: 14900 }, 'op-uuid', '127.0.0.1', 'jest');

      expect(planDal.update).toHaveBeenCalled();
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PLAN_UPDATED' }),
      );
    });

    it('should throw NotFoundException when plan not found', async () => {
      planDal.get.mockResolvedValue(null);

      await expect(
        service.updatePlan('bad-id', {}, 'op-uuid', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listPlans', () => {
    it('should return all plans', async () => {
      const result = await service.listPlans();
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('getSubscription', () => {
    it('should return subscription for org', async () => {
      const result = await service.getSubscription('org-uuid');
      expect(result.org_id).toBe('org-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      subscriptionDal.get.mockResolvedValue(null);

      await expect(service.getSubscription('bad-org')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription and audit log', async () => {
      await service.updateSubscription('org-uuid', { plan_tier: 'PROFESSIONAL' }, 'op-uuid', '127.0.0.1', 'jest');

      expect(subscriptionDal.update).toHaveBeenCalled();
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SUBSCRIPTION_UPDATED' }),
      );
    });
  });

  describe('listInvoices', () => {
    it('should return paginated invoices for org', async () => {
      const result = await service.listInvoices('org-uuid');
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('createInvoice', () => {
    it('should create an invoice', async () => {
      const result = await service.createInvoice('org-uuid', 9900, '2026-04-01', 'op-uuid', '127.0.0.1', 'jest');

      expect(result.amount_cents).toBe(9900);
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'INVOICE_CREATED' }),
      );
    });
  });
});
