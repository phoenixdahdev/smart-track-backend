import { StaffEvvPunchController } from './staff-evv-punch.controller';
import { PunchType } from '@enums/punch-type.enum';

describe('StaffEvvPunchController', () => {
  let controller: StaffEvvPunchController;
  let evvPunchService: {
    clockIn: jest.Mock;
    clockOut: jest.Mock;
    listByStaff: jest.Mock;
    findByIdForStaff: jest.Mock;
  };

  const mockPunch = {
    id: 'punch-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    individual_id: 'ind-uuid',
    punch_type: PunchType.CLOCK_IN,
    timestamp: new Date(),
  };

  const mockCurrentUser = {
    id: 'staff-uuid',
    org_id: 'org-uuid',
    role: 'DSP',
    email: 'dsp@test.com',
    name: 'DSP User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    email_verified: true,
  };

  const mockReq = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    evvPunchService = {
      clockIn: jest.fn().mockResolvedValue(mockPunch),
      clockOut: jest.fn().mockResolvedValue({
        ...mockPunch,
        punch_type: PunchType.CLOCK_OUT,
      }),
      listByStaff: jest.fn().mockResolvedValue({
        payload: [mockPunch],
        paginationMeta: { total: 1 },
      }),
      findByIdForStaff: jest.fn().mockResolvedValue(mockPunch),
    };

    controller = new StaffEvvPunchController(evvPunchService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /staff/evv-punches/clock-in', () => {
    it('should clock in', async () => {
      const dto = { individual_id: 'ind-uuid' };

      const result = await controller.clockIn(dto, mockCurrentUser as never, mockReq as never);

      expect(result.message).toBe('Clock-in recorded');
      expect(evvPunchService.clockIn).toHaveBeenCalledWith(
        dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest',
      );
    });
  });

  describe('POST /staff/evv-punches/clock-out', () => {
    it('should clock out', async () => {
      const dto = { individual_id: 'ind-uuid' };

      const result = await controller.clockOut(dto, mockCurrentUser as never, mockReq as never);

      expect(result.message).toBe('Clock-out recorded');
    });
  });

  describe('GET /staff/evv-punches', () => {
    it('should list my punches', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('EVV punches retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /staff/evv-punches/:id', () => {
    it('should get a punch by ID', async () => {
      const result = await controller.findById('punch-uuid', mockCurrentUser as never);

      expect(result.message).toBe('EVV punch retrieved');
      expect(evvPunchService.findByIdForStaff).toHaveBeenCalledWith(
        'punch-uuid', 'org-uuid', 'staff-uuid',
      );
    });
  });
});
