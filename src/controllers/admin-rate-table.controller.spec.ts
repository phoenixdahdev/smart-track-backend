import { AdminRateTableController } from './admin-rate-table.controller';

describe('AdminRateTableController', () => {
  let controller: AdminRateTableController;
  let rateTableService: {
    create: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
    findRate: jest.Mock;
  };

  const mockRecord = {
    id: 'rt-uuid',
    org_id: 'org-uuid',
    payer_config_id: 'pc-uuid',
    service_code_id: 'sc-uuid',
    rate_cents: 5000,
    effective_date: '2026-01-01',
    end_date: '2026-12-31',
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
    rateTableService = {
      create: jest.fn().mockResolvedValue(mockRecord),
      findById: jest.fn().mockResolvedValue(mockRecord),
      list: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      update: jest.fn().mockResolvedValue(mockRecord),
      deactivate: jest.fn().mockResolvedValue({ ...mockRecord, active: false }),
      findRate: jest.fn().mockResolvedValue(mockRecord),
    };

    controller = new AdminRateTableController(rateTableService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /admin/rate-tables', () => {
    it('should create a rate table entry', async () => {
      const dto = {
        payer_config_id: 'pc-uuid',
        service_code_id: 'sc-uuid',
        rate_cents: 5000,
        effective_date: '2026-01-01',
      };

      const result = await controller.create(
        dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Rate table created');
      expect(result.data.id).toBe('rt-uuid');
      expect(rateTableService.create).toHaveBeenCalledWith(
        dto, 'org-uuid', 'admin-uuid', 'ADMIN',
        expect.any(String), expect.any(String),
      );
    });
  });

  describe('GET /admin/rate-tables', () => {
    it('should list rate tables', async () => {
      const result = await controller.list('org-uuid', {} as never);

      expect(result.message).toBe('Rate tables retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /admin/rate-tables/lookup', () => {
    it('should lookup rate for payer/service code/date', async () => {
      const result = await controller.lookup(
        'pc-uuid', 'sc-uuid', '2026-06-15', 'org-uuid',
      );

      expect(result.message).toBe('Rate lookup complete');
      expect(result.data).toBeDefined();
      expect(rateTableService.findRate).toHaveBeenCalledWith(
        'pc-uuid', 'sc-uuid', '2026-06-15', 'org-uuid',
      );
    });

    it('should return null data when no rate found', async () => {
      rateTableService.findRate.mockResolvedValue(null);

      const result = await controller.lookup(
        'pc-uuid', 'sc-uuid', '2099-01-01', 'org-uuid',
      );

      expect(result.data).toBeNull();
    });
  });

  describe('GET /admin/rate-tables/:id', () => {
    it('should get rate table by id', async () => {
      const result = await controller.findById('rt-uuid', 'org-uuid');

      expect(result.message).toBe('Rate table retrieved');
      expect(result.data.id).toBe('rt-uuid');
    });
  });

  describe('PATCH /admin/rate-tables/:id', () => {
    it('should update a rate table entry', async () => {
      const dto = { rate_cents: 6000 };

      const result = await controller.update(
        'rt-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Rate table updated');
      expect(rateTableService.update).toHaveBeenCalledWith(
        'rt-uuid', dto, 'org-uuid', 'admin-uuid', 'ADMIN',
        expect.any(String), expect.any(String),
      );
    });
  });

  describe('DELETE /admin/rate-tables/:id', () => {
    it('should deactivate a rate table entry', async () => {
      const result = await controller.deactivate(
        'rt-uuid', mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Rate table deactivated');
      expect(rateTableService.deactivate).toHaveBeenCalledWith(
        'rt-uuid', 'org-uuid', 'admin-uuid', 'ADMIN',
        expect.any(String), expect.any(String),
      );
    });
  });
});
