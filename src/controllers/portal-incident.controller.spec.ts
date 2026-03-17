import { PortalIncidentController } from './portal-incident.controller';

describe('PortalIncidentController', () => {
  let controller: PortalIncidentController;
  let guardianPortalService: { getIncidentSummaries: jest.Mock };

  const mockCurrentUser = {
    id: 'guardian-uuid',
    org_id: 'org-uuid',
    role: 'GUARDIAN',
    email: 'guardian@test.com',
    name: 'Guardian User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  const mockSummary = {
    id: 'inc-uuid',
    type: 'BEHAVIORAL',
    occurred_at: new Date(),
    status: 'SUBMITTED',
  };

  beforeEach(() => {
    guardianPortalService = {
      getIncidentSummaries: jest.fn().mockResolvedValue({
        payload: [mockSummary],
        paginationMeta: { total: 1 },
      }),
    };

    controller = new PortalIncidentController(guardianPortalService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /portal/individuals/:id/incidents', () => {
    it('should list redacted incidents', async () => {
      const result = await controller.list('ind-uuid', mockCurrentUser as never, {});
      expect(result.message).toBe('Incidents retrieved');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('description');
      expect(result.data[0]).not.toHaveProperty('reported_by');
    });
  });
});
