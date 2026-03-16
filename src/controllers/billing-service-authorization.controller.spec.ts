import { BillingServiceAuthorizationController } from './billing-service-authorization.controller';

describe('BillingServiceAuthorizationController', () => {
  let controller: BillingServiceAuthorizationController;
  let serviceAuthorizationService: {
    create: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    listByIndividual: jest.Mock;
    update: jest.Mock;
    void: jest.Mock;
    checkThresholds: jest.Mock;
  };

  const mockRecord = {
    id: 'sa-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    auth_number: 'AUTH-001',
    units_authorized: 100,
    units_used: 0,
    units_pending: 0,
    status: 'ACTIVE',
  };

  const mockCurrentUser = {
    id: 'billing-uuid',
    org_id: 'org-uuid',
    role: 'BILLING_SPECIALIST',
    email: 'billing@test.com',
    name: 'Billing User',
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
    serviceAuthorizationService = {
      create: jest.fn().mockResolvedValue(mockRecord),
      findById: jest.fn().mockResolvedValue(mockRecord),
      list: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      listByIndividual: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      update: jest.fn().mockResolvedValue(mockRecord),
      void: jest.fn().mockResolvedValue({ ...mockRecord, status: 'VOIDED' }),
      checkThresholds: jest.fn().mockResolvedValue({
        auth: mockRecord,
        alerts: [],
      }),
    };

    controller = new BillingServiceAuthorizationController(
      serviceAuthorizationService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /billing/service-authorizations', () => {
    it('should create a service authorization', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        payer_config_id: 'pc-uuid',
        service_code_id: 'sc-uuid',
        auth_number: 'AUTH-001',
        units_authorized: 100,
        unit_type: '15MIN',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
      };

      const result = await controller.create(
        dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Service authorization created');
      expect(result.data.id).toBe('sa-uuid');
      expect(serviceAuthorizationService.create).toHaveBeenCalledWith(
        dto, 'org-uuid', 'billing-uuid', 'BILLING_SPECIALIST',
        expect.any(String), expect.any(String),
      );
    });
  });

  describe('GET /billing/service-authorizations', () => {
    it('should list service authorizations', async () => {
      const result = await controller.list('org-uuid', {} as never);

      expect(result.message).toBe('Service authorizations retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /billing/service-authorizations/:id', () => {
    it('should get service authorization by id', async () => {
      const result = await controller.findById('sa-uuid', 'org-uuid');

      expect(result.message).toBe('Service authorization retrieved');
      expect(result.data.id).toBe('sa-uuid');
    });
  });

  describe('PATCH /billing/service-authorizations/:id', () => {
    it('should update a service authorization', async () => {
      const dto = { units_authorized: 200 };

      const result = await controller.update(
        'sa-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Service authorization updated');
      expect(serviceAuthorizationService.update).toHaveBeenCalledWith(
        'sa-uuid', dto, 'org-uuid', 'billing-uuid', 'BILLING_SPECIALIST',
        expect.any(String), expect.any(String),
      );
    });
  });

  describe('POST /billing/service-authorizations/:id/void', () => {
    it('should void a service authorization', async () => {
      const dto = { reason: 'No longer needed' };

      const result = await controller.void(
        'sa-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Service authorization voided');
      expect(serviceAuthorizationService.void).toHaveBeenCalledWith(
        'sa-uuid', 'org-uuid', 'billing-uuid', 'BILLING_SPECIALIST',
        'No longer needed',
        expect.any(String), expect.any(String),
      );
    });
  });

  describe('GET /billing/service-authorizations/:id/thresholds', () => {
    it('should check authorization thresholds', async () => {
      const result = await controller.thresholds('sa-uuid', 'org-uuid');

      expect(result.message).toBe('Thresholds retrieved');
      expect(result.data.alerts).toHaveLength(0);
      expect(serviceAuthorizationService.checkThresholds).toHaveBeenCalledWith(
        'sa-uuid', 'org-uuid',
      );
    });
  });

  describe('GET /billing/service-authorizations/by-individual/:individualId', () => {
    it('should list authorizations by individual', async () => {
      const result = await controller.listByIndividual(
        'ind-uuid', 'org-uuid', {} as never,
      );

      expect(result.message).toBe('Service authorizations retrieved');
      expect(result.data).toHaveLength(1);
      expect(serviceAuthorizationService.listByIndividual).toHaveBeenCalledWith(
        'ind-uuid', 'org-uuid', {},
      );
    });
  });
});
