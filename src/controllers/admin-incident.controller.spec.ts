import { AdminIncidentController } from './admin-incident.controller';

describe('AdminIncidentController', () => {
  let controller: AdminIncidentController;
  let incidentService: {
    listAll: jest.Mock;
    listByIndividual: jest.Mock;
    findById: jest.Mock;
  };

  const mockIncident = { id: 'inc-uuid' };
  const mockCurrentUser = {
    id: 'admin-uuid', org_id: 'org-uuid', role: 'ADMIN',
    email: 'admin@test.com', name: 'Admin', sub_permissions: {},
    session_timeout: 1800, mfa_enabled: false, mfa_type: 'NONE', mfa_verified: true, email_verified: true,
  };
  const mockReq = {
    ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    incidentService = {
      listAll: jest.fn().mockResolvedValue({
        payload: [mockIncident], paginationMeta: { total: 1 },
      }),
      listByIndividual: jest.fn().mockResolvedValue({
        payload: [mockIncident], paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockIncident),
    };
    controller = new AdminIncidentController(incidentService as never);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });

  describe('GET /admin/incidents', () => {
    it('should list all incidents', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /admin/incidents/:id', () => {
    it('should get incident by ID', async () => {
      const result = await controller.findById('inc-uuid', mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Incident retrieved');
    });
  });
});
