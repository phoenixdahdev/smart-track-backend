import { StaffShiftController } from './staff-shift.controller';
import { ShiftStatus } from '@enums/shift-status.enum';

describe('StaffShiftController', () => {
  let controller: StaffShiftController;
  let shiftService: {
    listByStaff: jest.Mock;
    findByIdForStaff: jest.Mock;
    accept: jest.Mock;
    reject: jest.Mock;
  };

  const mockShift = {
    id: 'shift-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    individual_id: 'ind-uuid',
    shift_date: '2026-03-15',
    start_time: '08:00',
    end_time: '16:00',
    status: ShiftStatus.PUBLISHED,
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
    shiftService = {
      listByStaff: jest.fn().mockResolvedValue({
        payload: [mockShift],
        paginationMeta: { total: 1 },
      }),
      findByIdForStaff: jest.fn().mockResolvedValue(mockShift),
      accept: jest.fn().mockResolvedValue({ ...mockShift, status: ShiftStatus.ACCEPTED }),
      reject: jest.fn().mockResolvedValue({ ...mockShift, status: ShiftStatus.REJECTED }),
    };

    controller = new StaffShiftController(shiftService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /staff/shifts', () => {
    it('should list my shifts', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('Shifts retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /staff/shifts/:id', () => {
    it('should get a shift by ID', async () => {
      const result = await controller.findById('shift-uuid', mockCurrentUser as never);

      expect(result.message).toBe('Shift retrieved');
      expect(shiftService.findByIdForStaff).toHaveBeenCalledWith(
        'shift-uuid', 'org-uuid', 'staff-uuid',
      );
    });
  });

  describe('PATCH /staff/shifts/:id/accept', () => {
    it('should accept a shift', async () => {
      const result = await controller.accept(
        'shift-uuid', mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Shift accepted');
      expect(shiftService.accept).toHaveBeenCalledWith(
        'shift-uuid', 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest',
      );
    });
  });

  describe('PATCH /staff/shifts/:id/reject', () => {
    it('should reject a shift', async () => {
      const dto = { reason: 'Scheduling conflict' };

      const result = await controller.reject(
        'shift-uuid', dto, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Shift rejected');
      expect(shiftService.reject).toHaveBeenCalledWith(
        'shift-uuid', 'org-uuid', 'staff-uuid', 'Scheduling conflict', 'DSP', '127.0.0.1', 'jest',
      );
    });

    it('should reject a shift without reason', async () => {
      const dto = {};

      const result = await controller.reject(
        'shift-uuid', dto, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Shift rejected');
    });
  });
});
