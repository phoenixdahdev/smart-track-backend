import { SuperadminOrgController } from './superadmin-org.controller';
import { OrgStatus } from '@enums/org-status.enum';
import { PlatformRole } from '@enums/role.enum';

describe('SuperadminOrgController', () => {
  let controller: SuperadminOrgController;
  let agencyService: {
    listOrganizations: jest.Mock;
    getOrganization: jest.Mock;
    updateOrgStatus: jest.Mock;
    getContacts: jest.Mock;
    getAgreements: jest.Mock;
    toggleModule: jest.Mock;
    setFeatureFlag: jest.Mock;
    getModules: jest.Mock;
    getFeatureFlags: jest.Mock;
  };
  let subscriptionService: {
    getSubscription: jest.Mock;
    updateSubscription: jest.Mock;
    listInvoices: jest.Mock;
    createInvoice: jest.Mock;
  };

  const mockOrg = { id: 'org-uuid', legal_name: 'Test Agency', status: OrgStatus.ACTIVE };

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
    agencyService = {
      listOrganizations: jest.fn().mockResolvedValue({ payload: [mockOrg], paginationMeta: { total: 1 } }),
      getOrganization: jest.fn().mockResolvedValue(mockOrg),
      updateOrgStatus: jest.fn().mockResolvedValue({ ...mockOrg, status: OrgStatus.SUSPENDED }),
      getContacts: jest.fn().mockResolvedValue({ payload: [] }),
      getAgreements: jest.fn().mockResolvedValue({ payload: [] }),
      toggleModule: jest.fn().mockResolvedValue({ id: 'mod-uuid', enabled: true }),
      setFeatureFlag: jest.fn().mockResolvedValue({ id: 'flag-uuid', value: true }),
      getModules: jest.fn().mockResolvedValue({ payload: [] }),
      getFeatureFlags: jest.fn().mockResolvedValue({ payload: [] }),
    };
    subscriptionService = {
      getSubscription: jest.fn().mockResolvedValue({ id: 'sub-uuid', plan_tier: 'STARTER' }),
      updateSubscription: jest.fn().mockResolvedValue({ id: 'sub-uuid' }),
      listInvoices: jest.fn().mockResolvedValue({ payload: [], paginationMeta: { total: 0 } }),
      createInvoice: jest.fn().mockResolvedValue({ id: 'inv-uuid', amount_cents: 9900 }),
    };

    controller = new SuperadminOrgController(
      agencyService as never,
      subscriptionService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /superadmin/organizations', () => {
    it('should list organizations', async () => {
      const result = await controller.list({} as never);
      expect(result.message).toBe('Organizations retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /superadmin/organizations/:id', () => {
    it('should get organization detail', async () => {
      const result = await controller.findById('org-uuid');
      expect(result.message).toBe('Organization retrieved');
    });
  });

  describe('POST /superadmin/organizations/:id/status', () => {
    it('should update org status', async () => {
      const result = await controller.updateStatus(
        'org-uuid', { status: OrgStatus.SUSPENDED, reason: 'Compliance' }, mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Organization status updated');
    });
  });

  describe('POST /superadmin/organizations/:id/modules', () => {
    it('should toggle module', async () => {
      const result = await controller.toggleModule(
        'org-uuid', { module_name: 'billing', enabled: true }, mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Module enabled');
    });
  });

  describe('POST /superadmin/organizations/:id/feature-flags', () => {
    it('should set feature flag', async () => {
      const result = await controller.setFeatureFlag(
        'org-uuid', { flag_name: 'beta', value: true }, mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Feature flag set');
    });
  });

  describe('GET /superadmin/organizations/:id/subscription', () => {
    it('should get subscription', async () => {
      const result = await controller.getSubscription('org-uuid');
      expect(result.message).toBe('Subscription retrieved');
    });
  });

  describe('POST /superadmin/organizations/:id/invoices', () => {
    it('should create invoice', async () => {
      const result = await controller.createInvoice(
        'org-uuid', { amount_cents: 9900, due_date: '2026-04-01' }, mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Invoice created');
    });
  });
});
