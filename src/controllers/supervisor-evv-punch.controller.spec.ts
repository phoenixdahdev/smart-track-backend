import { SupervisorEvvPunchController } from './supervisor-evv-punch.controller';
import { PunchType } from '@enums/punch-type.enum';

describe('SupervisorEvvPunchController', () => {
  let controller: SupervisorEvvPunchController;
  let evvPunchService: {
    listAll: jest.Mock;
    findMissedPunches: jest.Mock;
    listByStaff: jest.Mock;
    findById: jest.Mock;
  };
  let evvCorrectionService: { flagMissedPunch: jest.Mock };

  const mockPunch = {
    id: 'punch-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    punch_type: PunchType.CLOCK_IN,
  };

  const mockCurrentUser = {
    id: 'supervisor-uuid',
    org_id: 'org-uuid',
    role: 'SUPERVISOR',
    email: 'sup@test.com',
    name: 'Supervisor',
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
    evvPunchService = {
      listAll: jest.fn().mockResolvedValue({
        payload: [mockPunch],
        paginationMeta: { total: 1 },
      }),
      findMissedPunches: jest.fn().mockResolvedValue([mockPunch]),
      listByStaff: jest.fn().mockResolvedValue({
        payload: [mockPunch],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockPunch),
    };
    evvCorrectionService = {
      flagMissedPunch: jest.fn().mockResolvedValue({ id: 'corr-uuid' }),
    };

    controller = new SupervisorEvvPunchController(
      evvPunchService as never,
      evvCorrectionService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /supervisor/evv-punches', () => {
    it('should list all punches', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('EVV punches retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /supervisor/evv-punches/missed', () => {
    it('should get missed punches', async () => {
      const result = await controller.missed(mockCurrentUser as never);

      expect(result.message).toBe('Missed punches retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /supervisor/evv-punches/by-staff/:staffId', () => {
    it('should list punches by staff', async () => {
      const result = await controller.listByStaff(
        'staff-uuid', 'org-uuid', {} as never,
      );

      expect(result.message).toBe('EVV punches retrieved');
    });
  });

  describe('POST /supervisor/evv-punches/flag-missed', () => {
    it('should flag a missed punch', async () => {
      const dto = {
        staff_id: 'staff-uuid',
        individual_id: 'ind-uuid',
        punch_type: PunchType.CLOCK_OUT,
        requested_time: '2026-03-10T17:00:00.000Z',
        reason: 'Staff forgot to clock out',
      };

      const result = await controller.flagMissed(
        dto, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Missed punch flagged');
    });
  });
});
