import { PortalAdlController } from './portal-adl.controller';

describe('PortalAdlController', () => {
  let controller: PortalAdlController;
  let guardianPortalService: { getAdlSummaries: jest.Mock };

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

  const mockAdl = {
    id: 'adl-uuid',
    category_name: 'Dressing',
    assistance_level: 'MODERATE',
    recorded_at: new Date(),
  };

  beforeEach(() => {
    guardianPortalService = {
      getAdlSummaries: jest.fn().mockResolvedValue({
        payload: [mockAdl],
        paginationMeta: { total: 1 },
      }),
    };

    controller = new PortalAdlController(guardianPortalService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /portal/individuals/:id/adl', () => {
    it('should list ADL summaries', async () => {
      const result = await controller.list('ind-uuid', mockCurrentUser as never, {});
      expect(result.message).toBe('ADL summaries retrieved');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('staff_id');
      expect(result.data[0]).not.toHaveProperty('notes');
    });
  });
});
