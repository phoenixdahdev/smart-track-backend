import { SuperadminBreakGlassController } from './superadmin-break-glass.controller';
import { PlatformRole } from '@enums/role.enum';

describe('SuperadminBreakGlassController', () => {
  let controller: SuperadminBreakGlassController;
  let breakGlassService: {
    request: jest.Mock;
    approve: jest.Mock;
    end: jest.Mock;
    list: jest.Mock;
    findById: jest.Mock;
    getActiveByOrg: jest.Mock;
  };

  const mockSession = {
    id: 'session-uuid',
    operator_id: 'engineer-uuid',
    org_id: 'org-uuid',
    ticket_id: 'TICK-123',
  };

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
    breakGlassService = {
      request: jest.fn().mockResolvedValue(mockSession),
      approve: jest.fn().mockResolvedValue({ ...mockSession, approved_by: 'op-uuid' }),
      end: jest.fn().mockResolvedValue({ ...mockSession, end_at: new Date() }),
      list: jest.fn().mockResolvedValue({ payload: [mockSession], paginationMeta: { total: 1 } }),
      findById: jest.fn().mockResolvedValue(mockSession),
      getActiveByOrg: jest.fn().mockResolvedValue({ payload: [mockSession] }),
    };

    controller = new SuperadminBreakGlassController(breakGlassService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /superadmin/break-glass', () => {
    it('should request break-glass session', async () => {
      const dto = { org_id: 'org-uuid', ticket_id: 'TICK-123', reason: 'Urgent', data_scope: 'READ_ONLY' };
      const result = await controller.request(dto, mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Break-glass session requested');
    });
  });

  describe('POST /superadmin/break-glass/:id/approve', () => {
    it('should approve break-glass session', async () => {
      const result = await controller.approve('session-uuid', mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Break-glass session approved');
    });
  });

  describe('POST /superadmin/break-glass/:id/end', () => {
    it('should end break-glass session', async () => {
      const result = await controller.end(
        'session-uuid', { actions_summary: 'Fixed data' }, mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Break-glass session ended');
    });
  });

  describe('GET /superadmin/break-glass', () => {
    it('should list sessions', async () => {
      const result = await controller.list({} as never);
      expect(result.message).toBe('Sessions retrieved');
    });
  });

  describe('GET /superadmin/break-glass/:id', () => {
    it('should get session by ID', async () => {
      const result = await controller.findById('session-uuid');
      expect(result.message).toBe('Session retrieved');
    });
  });

  describe('GET /superadmin/break-glass/org/:orgId', () => {
    it('should get active sessions for org', async () => {
      const result = await controller.getActiveByOrg('org-uuid');
      expect(result.message).toBe('Active sessions retrieved');
    });
  });
});
