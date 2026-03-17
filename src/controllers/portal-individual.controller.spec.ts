import { PortalIndividualController } from './portal-individual.controller';
import { GuardianRelationship } from '@enums/guardian-relationship.enum';

describe('PortalIndividualController', () => {
  let controller: PortalIndividualController;
  let guardianPortalService: {
    getLinkedIndividuals: jest.Mock;
    getIndividualProfile: jest.Mock;
    getDashboard: jest.Mock;
  };

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

  const mockReq = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  const mockIndividualSummary = {
    id: 'ind-uuid',
    first_name: 'John',
    last_name: 'Doe',
    active: true,
    relationship: GuardianRelationship.PARENT,
  };

  const mockProfile = {
    id: 'ind-uuid',
    first_name: 'John',
    last_name: 'Doe',
    age: 26,
    active: true,
  };

  const mockDashboard = {
    individual_id: 'ind-uuid',
    individual_name: 'John Doe',
    recent_service_count: 5,
    upcoming_shift_count: 3,
    active_isp_goals: 2,
    recent_incident_count: 1,
    unread_notification_count: 4,
  };

  beforeEach(() => {
    guardianPortalService = {
      getLinkedIndividuals: jest.fn().mockResolvedValue({
        payload: [mockIndividualSummary],
        paginationMeta: { total: 1 },
      }),
      getIndividualProfile: jest.fn().mockResolvedValue(mockProfile),
      getDashboard: jest.fn().mockResolvedValue(mockDashboard),
    };

    controller = new PortalIndividualController(guardianPortalService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /portal/individuals', () => {
    it('should list linked individuals', async () => {
      const result = await controller.list(mockCurrentUser as never, {});
      expect(result.message).toBe('Linked individuals retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /portal/individuals/:individualId', () => {
    it('should return redacted profile', async () => {
      const result = await controller.getProfile(
        'ind-uuid', mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Individual profile retrieved');
      expect(result.data.age).toBe(26);
    });
  });

  describe('GET /portal/individuals/:individualId/dashboard', () => {
    it('should return dashboard data', async () => {
      const result = await controller.dashboard('ind-uuid', mockCurrentUser as never);
      expect(result.message).toBe('Dashboard retrieved');
      expect(result.data.recent_service_count).toBe(5);
    });
  });
});
