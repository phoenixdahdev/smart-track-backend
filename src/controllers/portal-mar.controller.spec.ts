import { PortalMarController } from './portal-mar.controller';

describe('PortalMarController', () => {
  let controller: PortalMarController;
  let guardianPortalService: { getMarSummaries: jest.Mock };

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

  const mockMar = {
    id: 'mar-uuid',
    drug_name: 'Lisinopril',
    scheduled_time: new Date(),
    administered_time: new Date(),
    result: 'GIVEN',
  };

  beforeEach(() => {
    guardianPortalService = {
      getMarSummaries: jest.fn().mockResolvedValue({
        payload: [mockMar],
        paginationMeta: { total: 1 },
      }),
    };

    controller = new PortalMarController(guardianPortalService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /portal/individuals/:id/medications', () => {
    it('should list MAR summaries', async () => {
      const result = await controller.list('ind-uuid', mockCurrentUser as never, {});
      expect(result.message).toBe('Medications retrieved');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('administered_by');
      expect(result.data[0]).not.toHaveProperty('dose');
    });
  });
});
