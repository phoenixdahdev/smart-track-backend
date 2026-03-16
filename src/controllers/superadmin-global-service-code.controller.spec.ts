import { SuperadminGlobalServiceCodeController } from './superadmin-global-service-code.controller';
import { PlatformRole } from '@enums/role.enum';

describe('SuperadminGlobalServiceCodeController', () => {
  let controller: SuperadminGlobalServiceCodeController;
  let codeService: {
    create: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    deprecate: jest.Mock;
  };

  const mockCode = { id: 'code-uuid', code: 'H2015', status: 'ACTIVE' };

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
    codeService = {
      create: jest.fn().mockResolvedValue(mockCode),
      findById: jest.fn().mockResolvedValue(mockCode),
      list: jest.fn().mockResolvedValue({ payload: [mockCode], paginationMeta: { total: 1 } }),
      update: jest.fn().mockResolvedValue(mockCode),
      deprecate: jest.fn().mockResolvedValue({ ...mockCode, status: 'DEPRECATED' }),
    };

    controller = new SuperadminGlobalServiceCodeController(codeService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /superadmin/platform/service-codes', () => {
    it('should create a service code', async () => {
      const dto = { code: 'H2015', description: 'Test', code_type: 'HCPCS', valid_states: ['IL'], billing_unit: '15MIN' };
      const result = await controller.create(dto, mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Service code created');
    });
  });

  describe('GET /superadmin/platform/service-codes', () => {
    it('should list service codes', async () => {
      const result = await controller.list({} as never);
      expect(result.message).toBe('Service codes retrieved');
    });
  });

  describe('GET /superadmin/platform/service-codes/:id', () => {
    it('should get service code by ID', async () => {
      const result = await controller.findById('code-uuid');
      expect(result.message).toBe('Service code retrieved');
    });
  });

  describe('PATCH /superadmin/platform/service-codes/:id', () => {
    it('should update a service code', async () => {
      const result = await controller.update('code-uuid', { description: 'Updated' }, mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Service code updated');
    });
  });

  describe('POST /superadmin/platform/service-codes/:id/deprecate', () => {
    it('should deprecate a service code', async () => {
      const result = await controller.deprecate('code-uuid', mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Service code deprecated');
    });
  });
});
