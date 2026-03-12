import { SupervisorIncidentController } from './supervisor-incident.controller';

describe('SupervisorIncidentController', () => {
  let controller: SupervisorIncidentController;
  let incidentService: {
    listPendingReview: jest.Mock;
    findById: jest.Mock;
    startReview: jest.Mock;
    close: jest.Mock;
  };

  const mockIncident = { id: 'inc-uuid', status: 'SUBMITTED' };
  const mockCurrentUser = {
    id: 'supervisor-uuid', org_id: 'org-uuid', role: 'SUPERVISOR',
    email: 'sup@test.com', name: 'Supervisor', sub_permissions: {},
    session_timeout: 1800, mfa_enabled: false, email_verified: true,
  };
  const mockReq = {
    ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    incidentService = {
      listPendingReview: jest.fn().mockResolvedValue({
        payload: [mockIncident], paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockIncident),
      startReview: jest.fn().mockResolvedValue(mockIncident),
      close: jest.fn().mockResolvedValue(mockIncident),
    };
    controller = new SupervisorIncidentController(incidentService as never);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });

  describe('GET /supervisor/incidents/review-queue', () => {
    it('should return review queue', async () => {
      const result = await controller.reviewQueue(mockCurrentUser as never, {} as never);
      expect(result.message).toBe('Incident review queue retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('PATCH /supervisor/incidents/:id/close', () => {
    it('should close an incident', async () => {
      const result = await controller.close(
        'inc-uuid',
        { supervisor_comments: 'Resolved' },
        mockCurrentUser as never,
        mockReq as never,
      );
      expect(result.message).toBe('Incident closed');
    });
  });
});
