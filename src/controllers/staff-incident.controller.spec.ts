import { StaffIncidentController } from './staff-incident.controller';

describe('StaffIncidentController', () => {
  let controller: StaffIncidentController;
  let incidentService: {
    create: jest.Mock;
    listByIndividual: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    submit: jest.Mock;
  };

  const mockIncident = { id: 'inc-uuid', type: 'BEHAVIORAL' };
  const mockCurrentUser = {
    id: 'staff-uuid', org_id: 'org-uuid', role: 'DSP',
    email: 'dsp@test.com', name: 'DSP', sub_permissions: {},
    session_timeout: 3600, mfa_enabled: false, email_verified: true,
  };
  const mockReq = {
    ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    incidentService = {
      create: jest.fn().mockResolvedValue(mockIncident),
      listByIndividual: jest.fn().mockResolvedValue({
        payload: [mockIncident], paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockIncident),
      update: jest.fn().mockResolvedValue(mockIncident),
      submit: jest.fn().mockResolvedValue(mockIncident),
    };
    controller = new StaffIncidentController(incidentService as never);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });

  describe('POST /staff/incidents', () => {
    it('should create an incident', async () => {
      const dto = {
        individual_id: 'ind-uuid', type: 'BEHAVIORAL',
        description: 'Test', occurred_at: '2026-03-10T14:30:00.000Z',
      };
      const result = await controller.create(dto, mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Incident reported');
    });
  });

  describe('PATCH /staff/incidents/:id/submit', () => {
    it('should submit incident', async () => {
      const result = await controller.submit('inc-uuid', mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Incident submitted');
    });
  });
});
