import { AdminServiceCodeController } from './admin-service-code.controller';

describe('AdminServiceCodeController', () => {
  let controller: AdminServiceCodeController;
  let serviceCodeService: {
    create: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
  };

  const mockRecord = {
    id: 'sc-uuid',
    org_id: 'org-uuid',
    global_code_id: 'gc-uuid',
    code: 'H2015',
    description: 'Community support',
    active: true,
  };

  const mockCurrentUser = {
    id: 'admin-uuid',
    org_id: 'org-uuid',
    role: 'ADMIN',
    email: 'admin@test.com',
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
    serviceCodeService = {
      create: jest.fn().mockResolvedValue(mockRecord),
      findById: jest.fn().mockResolvedValue(mockRecord),
      list: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      update: jest.fn().mockResolvedValue(mockRecord),
      deactivate: jest.fn().mockResolvedValue({ ...mockRecord, active: false }),
    };

    controller = new AdminServiceCodeController(serviceCodeService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /admin/service-codes', () => {
    it('should create a service code', async () => {
      const dto = { global_code_id: 'gc-uuid' };

      const result = await controller.create(
        dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Service code created');
      expect(result.data.id).toBe('sc-uuid');
      expect(serviceCodeService.create).toHaveBeenCalledWith(
        dto, 'org-uuid', 'admin-uuid', 'ADMIN',
        expect.any(String), expect.any(String),
      );
    });
  });

  describe('GET /admin/service-codes', () => {
    it('should list service codes', async () => {
      const result = await controller.list('org-uuid', {} as never);

      expect(result.message).toBe('Service codes retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /admin/service-codes/:id', () => {
    it('should get service code by id', async () => {
      const result = await controller.findById('sc-uuid', 'org-uuid');

      expect(result.message).toBe('Service code retrieved');
      expect(result.data.id).toBe('sc-uuid');
    });
  });

  describe('PATCH /admin/service-codes/:id', () => {
    it('should update a service code', async () => {
      const dto = { description: 'Updated' };

      const result = await controller.update(
        'sc-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Service code updated');
      expect(serviceCodeService.update).toHaveBeenCalledWith(
        'sc-uuid', dto, 'org-uuid', 'admin-uuid', 'ADMIN',
        expect.any(String), expect.any(String),
      );
    });
  });

  describe('DELETE /admin/service-codes/:id', () => {
    it('should deactivate a service code', async () => {
      const result = await controller.deactivate(
        'sc-uuid', mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Service code deactivated');
      expect(serviceCodeService.deactivate).toHaveBeenCalledWith(
        'sc-uuid', 'org-uuid', 'admin-uuid', 'ADMIN',
        expect.any(String), expect.any(String),
      );
    });
  });
});
