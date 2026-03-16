import { SuperadminOperatorController } from './superadmin-operator.controller';
import { PlatformRole } from '@enums/role.enum';

describe('SuperadminOperatorController', () => {
  let controller: SuperadminOperatorController;
  let operatorService: {
    create: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
  };

  const mockOperator = {
    id: 'op-uuid',
    email: 'admin@smarttrack.com',
    name: 'Admin',
    role: PlatformRole.PLATFORM_ADMIN,
    active: true,
  };

  const mockCurrentUser = {
    id: 'current-op-uuid',
    role: PlatformRole.PLATFORM_OWNER,
    org_id: null,
    email: 'owner@smarttrack.com',
    name: 'Owner',
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
    operatorService = {
      create: jest.fn().mockResolvedValue(mockOperator),
      findById: jest.fn().mockResolvedValue(mockOperator),
      list: jest.fn().mockResolvedValue({
        payload: [mockOperator],
        paginationMeta: { total: 1, limit: 20, page: 1, total_pages: 1, has_next: false, has_previous: false },
      }),
      update: jest.fn().mockResolvedValue(mockOperator),
      deactivate: jest.fn().mockResolvedValue({ ...mockOperator, active: false }),
    };

    controller = new SuperadminOperatorController(operatorService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /superadmin/operators', () => {
    it('should create an operator', async () => {
      const dto = { email: 'new@smarttrack.com', name: 'New', role: PlatformRole.PLATFORM_ADMIN };

      const result = await controller.create(dto, mockCurrentUser as never, mockReq as never);

      expect(result.message).toBe('Operator created');
      expect(result.data.id).toBe('op-uuid');
    });
  });

  describe('GET /superadmin/operators', () => {
    it('should list operators', async () => {
      const result = await controller.list({} as never);

      expect(result.message).toBe('Operators retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /superadmin/operators/:id', () => {
    it('should get operator by ID', async () => {
      const result = await controller.findById('op-uuid');

      expect(result.message).toBe('Operator retrieved');
      expect(result.data.id).toBe('op-uuid');
    });
  });

  describe('PATCH /superadmin/operators/:id', () => {
    it('should update an operator', async () => {
      const result = await controller.update('op-uuid', { name: 'Updated' }, mockCurrentUser as never, mockReq as never);

      expect(result.message).toBe('Operator updated');
      expect(operatorService.update).toHaveBeenCalledWith(
        'op-uuid', { name: 'Updated' }, 'current-op-uuid', '127.0.0.1', 'jest',
      );
    });
  });

  describe('DELETE /superadmin/operators/:id', () => {
    it('should deactivate an operator', async () => {
      const result = await controller.deactivate('op-uuid', mockCurrentUser as never, mockReq as never);

      expect(result.message).toBe('Operator deactivated');
      expect(operatorService.deactivate).toHaveBeenCalledWith(
        'op-uuid', 'current-op-uuid', '127.0.0.1', 'jest',
      );
    });
  });
});
