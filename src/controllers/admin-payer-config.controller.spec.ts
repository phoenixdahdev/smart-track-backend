import { AdminPayerConfigController } from './admin-payer-config.controller';

describe('AdminPayerConfigController', () => {
  let controller: AdminPayerConfigController;
  let payerConfigService: {
    create: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
  };

  const mockRecord = {
    id: 'pc-uuid',
    org_id: 'org-uuid',
    global_payer_id: 'gp-uuid',
    payer_name: 'Test Payer',
    payer_id_edi: 'EDI001',
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
    email_verified: true,
  };

  const mockReq = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    payerConfigService = {
      create: jest.fn().mockResolvedValue(mockRecord),
      findById: jest.fn().mockResolvedValue(mockRecord),
      list: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      update: jest.fn().mockResolvedValue(mockRecord),
      deactivate: jest.fn().mockResolvedValue({ ...mockRecord, active: false }),
    };

    controller = new AdminPayerConfigController(payerConfigService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /admin/payer-configs', () => {
    it('should create a payer config', async () => {
      const dto = { global_payer_id: 'gp-uuid' };

      const result = await controller.create(
        dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Payer config created');
      expect(result.data.id).toBe('pc-uuid');
      expect(payerConfigService.create).toHaveBeenCalledWith(
        dto, 'org-uuid', 'admin-uuid', 'ADMIN',
        expect.any(String), expect.any(String),
      );
    });
  });

  describe('GET /admin/payer-configs', () => {
    it('should list payer configs', async () => {
      const result = await controller.list('org-uuid', {} as never);

      expect(result.message).toBe('Payer configs retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /admin/payer-configs/:id', () => {
    it('should get payer config by id', async () => {
      const result = await controller.findById('pc-uuid', 'org-uuid');

      expect(result.message).toBe('Payer config retrieved');
      expect(result.data.id).toBe('pc-uuid');
    });
  });

  describe('PATCH /admin/payer-configs/:id', () => {
    it('should update a payer config', async () => {
      const dto = { payer_name: 'Updated' };

      const result = await controller.update(
        'pc-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Payer config updated');
      expect(payerConfigService.update).toHaveBeenCalledWith(
        'pc-uuid', dto, 'org-uuid', 'admin-uuid', 'ADMIN',
        expect.any(String), expect.any(String),
      );
    });
  });

  describe('DELETE /admin/payer-configs/:id', () => {
    it('should deactivate a payer config', async () => {
      const result = await controller.deactivate(
        'pc-uuid', mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Payer config deactivated');
      expect(payerConfigService.deactivate).toHaveBeenCalledWith(
        'pc-uuid', 'org-uuid', 'admin-uuid', 'ADMIN',
        expect.any(String), expect.any(String),
      );
    });
  });
});
