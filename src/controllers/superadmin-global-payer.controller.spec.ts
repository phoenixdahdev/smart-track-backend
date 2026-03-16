import { SuperadminGlobalPayerController } from './superadmin-global-payer.controller';
import { PlatformRole } from '@enums/role.enum';

describe('SuperadminGlobalPayerController', () => {
  let controller: SuperadminGlobalPayerController;
  let payerService: {
    create: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
  };

  const mockPayer = { id: 'payer-uuid', payer_name: 'Aetna', active: true };

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
    payerService = {
      create: jest.fn().mockResolvedValue(mockPayer),
      findById: jest.fn().mockResolvedValue(mockPayer),
      list: jest.fn().mockResolvedValue({ payload: [mockPayer], paginationMeta: { total: 1 } }),
      update: jest.fn().mockResolvedValue(mockPayer),
      deactivate: jest.fn().mockResolvedValue({ ...mockPayer, active: false }),
    };

    controller = new SuperadminGlobalPayerController(payerService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /superadmin/platform/payers', () => {
    it('should create a payer', async () => {
      const dto = { payer_name: 'Aetna', payer_id_edi: 'AETNA001' };
      const result = await controller.create(dto, mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Payer created');
    });
  });

  describe('GET /superadmin/platform/payers', () => {
    it('should list payers', async () => {
      const result = await controller.list({} as never);
      expect(result.message).toBe('Payers retrieved');
    });
  });

  describe('GET /superadmin/platform/payers/:id', () => {
    it('should get payer by ID', async () => {
      const result = await controller.findById('payer-uuid');
      expect(result.message).toBe('Payer retrieved');
    });
  });

  describe('PATCH /superadmin/platform/payers/:id', () => {
    it('should update a payer', async () => {
      const result = await controller.update('payer-uuid', { payer_name: 'Updated' }, mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Payer updated');
    });
  });

  describe('DELETE /superadmin/platform/payers/:id', () => {
    it('should deactivate a payer', async () => {
      const result = await controller.deactivate('payer-uuid', mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Payer deactivated');
    });
  });
});
