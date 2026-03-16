import { AdminEvvPunchController } from './admin-evv-punch.controller';
import { PunchType } from '@enums/punch-type.enum';

describe('AdminEvvPunchController', () => {
  let controller: AdminEvvPunchController;
  let evvPunchService: {
    listAll: jest.Mock;
    listByStaff: jest.Mock;
    listByIndividual: jest.Mock;
    findById: jest.Mock;
    getSummary: jest.Mock;
  };

  const mockPunch = {
    id: 'punch-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    punch_type: PunchType.CLOCK_IN,
  };

  const mockCurrentUser = {
    id: 'admin-uuid',
    org_id: 'org-uuid',
    role: 'ADMIN',
    email: 'admin@test.com',
    name: 'Admin User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  beforeEach(() => {
    evvPunchService = {
      listAll: jest.fn().mockResolvedValue({
        payload: [mockPunch],
        paginationMeta: { total: 1 },
      }),
      listByStaff: jest.fn().mockResolvedValue({
        payload: [mockPunch],
        paginationMeta: { total: 1 },
      }),
      listByIndividual: jest.fn().mockResolvedValue({
        payload: [mockPunch],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockPunch),
      getSummary: jest.fn().mockResolvedValue({
        total_punches: 10,
        clock_ins: 5,
        clock_outs: 5,
        location_confirmation_rate: 80,
      }),
    };

    controller = new AdminEvvPunchController(evvPunchService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/evv-punches', () => {
    it('should list all punches', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('EVV punches retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /admin/evv-punches/by-staff/:staffId', () => {
    it('should list punches by staff', async () => {
      const result = await controller.listByStaff(
        'staff-uuid', 'org-uuid', {} as never,
      );

      expect(result.message).toBe('EVV punches retrieved');
    });
  });

  describe('GET /admin/evv-punches/by-individual/:individualId', () => {
    it('should list punches by individual', async () => {
      const result = await controller.listByIndividual(
        'ind-uuid', 'org-uuid', {} as never,
      );

      expect(result.message).toBe('EVV punches retrieved');
    });
  });

  describe('GET /admin/evv-punches/summary', () => {
    it('should get aggregate stats', async () => {
      const result = await controller.summary(mockCurrentUser as never);

      expect(result.message).toBe('EVV summary retrieved');
      expect(result.data.total_punches).toBe(10);
    });
  });
});
