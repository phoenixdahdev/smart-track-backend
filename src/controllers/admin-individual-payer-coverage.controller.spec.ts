import { AdminIndividualPayerCoverageController } from './admin-individual-payer-coverage.controller';

describe('AdminIndividualPayerCoverageController', () => {
  let controller: AdminIndividualPayerCoverageController;
  let coverageService: {
    create: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    listByIndividual: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
  };

  const mockRecord = {
    id: 'cov-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    payer_config_id: 'pc-uuid',
    subscriber_id: 'SUB-001',
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
    coverageService = {
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
      deactivate: jest.fn().mockResolvedValue({ ...mockRecord, active: false }),
    };

    controller = new AdminIndividualPayerCoverageController(
      coverageService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /admin/individual-payer-coverages', () => {
    it('should create a coverage', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        payer_config_id: 'pc-uuid',
        subscriber_id: 'SUB-001',
        coverage_start: '2026-01-01',
      };

      const result = await controller.create(
        dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Coverage created');
      expect(result.data.id).toBe('cov-uuid');
      expect(coverageService.create).toHaveBeenCalledWith(
        dto, 'org-uuid', 'admin-uuid', 'ADMIN',
        expect.any(String), expect.any(String),
      );
    });
  });

  describe('GET /admin/individual-payer-coverages', () => {
    it('should list coverages', async () => {
      const result = await controller.list('org-uuid', {} as never);

      expect(result.message).toBe('Coverages retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /admin/individual-payer-coverages/:id', () => {
    it('should get coverage by id', async () => {
      const result = await controller.findById('cov-uuid', 'org-uuid');

      expect(result.message).toBe('Coverage retrieved');
      expect(result.data.id).toBe('cov-uuid');
    });
  });

  describe('PATCH /admin/individual-payer-coverages/:id', () => {
    it('should update a coverage', async () => {
      const dto = { subscriber_id: 'SUB-002' };

      const result = await controller.update(
        'cov-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Coverage updated');
      expect(coverageService.update).toHaveBeenCalledWith(
        'cov-uuid', dto, 'org-uuid', 'admin-uuid', 'ADMIN',
        expect.any(String), expect.any(String),
      );
    });
  });

  describe('DELETE /admin/individual-payer-coverages/:id', () => {
    it('should deactivate a coverage', async () => {
      const result = await controller.deactivate(
        'cov-uuid', mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Coverage deactivated');
      expect(coverageService.deactivate).toHaveBeenCalledWith(
        'cov-uuid', 'org-uuid', 'admin-uuid', 'ADMIN',
        expect.any(String), expect.any(String),
      );
    });
  });

  describe('GET /admin/individual-payer-coverages/by-individual/:individualId', () => {
    it('should list coverages by individual', async () => {
      const result = await controller.listByIndividual(
        'ind-uuid', 'org-uuid', {} as never,
      );

      expect(result.message).toBe('Coverages retrieved');
      expect(result.data).toHaveLength(1);
      expect(coverageService.listByIndividual).toHaveBeenCalledWith(
        'ind-uuid', 'org-uuid', {},
      );
    });
  });
});
