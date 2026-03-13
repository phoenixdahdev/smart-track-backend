import { SupervisorShiftController } from './supervisor-shift.controller';
import { ShiftStatus } from '@enums/shift-status.enum';

describe('SupervisorShiftController', () => {
  let controller: SupervisorShiftController;
  let shiftService: {
    create: jest.Mock;
    listAll: jest.Mock;
    checkConflicts: jest.Mock;
    listByStaff: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    publish: jest.Mock;
    cancel: jest.Mock;
  };

  const mockShift = {
    id: 'shift-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    individual_id: 'ind-uuid',
    shift_date: '2026-03-15',
    start_time: '08:00',
    end_time: '16:00',
    status: ShiftStatus.DRAFT,
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
    email_verified: true,
  };

  const mockReq = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    shiftService = {
      create: jest.fn().mockResolvedValue(mockShift),
      listAll: jest.fn().mockResolvedValue({
        payload: [mockShift],
        paginationMeta: { total: 1 },
      }),
      checkConflicts: jest.fn().mockResolvedValue([]),
      listByStaff: jest.fn().mockResolvedValue({
        payload: [mockShift],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockShift),
      update: jest.fn().mockResolvedValue(mockShift),
      publish: jest.fn().mockResolvedValue({ ...mockShift, status: ShiftStatus.PUBLISHED }),
      cancel: jest.fn().mockResolvedValue({ ...mockShift, status: ShiftStatus.CANCELLED }),
    };

    controller = new SupervisorShiftController(shiftService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /supervisor/shifts', () => {
    it('should create a shift', async () => {
      const dto = {
        staff_id: 'staff-uuid',
        individual_id: 'ind-uuid',
        shift_date: '2026-03-15',
        start_time: '08:00',
        end_time: '16:00',
      };

      const result = await controller.create(
        dto, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Shift created');
      expect(result.data.id).toBe('shift-uuid');
    });
  });

  describe('GET /supervisor/shifts', () => {
    it('should list all shifts', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('Shifts retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /supervisor/shifts/conflicts', () => {
    it('should check conflicts', async () => {
      const result = await controller.conflicts(
        'org-uuid', 'staff-uuid', '2026-03-15', '08:00', '16:00',
      );

      expect(result.message).toBe('Conflict check complete');
      expect(shiftService.checkConflicts).toHaveBeenCalledWith(
        'org-uuid', 'staff-uuid', '2026-03-15', '08:00', '16:00',
      );
    });
  });

  describe('GET /supervisor/shifts/by-staff/:staffId', () => {
    it('should list shifts by staff', async () => {
      const result = await controller.listByStaff(
        'staff-uuid', 'org-uuid', {} as never,
      );

      expect(result.message).toBe('Shifts retrieved');
    });
  });

  describe('GET /supervisor/shifts/:id', () => {
    it('should get a shift by ID', async () => {
      const result = await controller.findById('shift-uuid', 'org-uuid');

      expect(result.message).toBe('Shift retrieved');
    });
  });

  describe('PATCH /supervisor/shifts/:id', () => {
    it('should update a shift', async () => {
      const dto = { start_time: '09:00' };

      const result = await controller.update(
        'shift-uuid', dto, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Shift updated');
    });
  });

  describe('PATCH /supervisor/shifts/:id/publish', () => {
    it('should publish a shift', async () => {
      const result = await controller.publish(
        'shift-uuid', mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Shift published');
    });
  });

  describe('PATCH /supervisor/shifts/:id/cancel', () => {
    it('should cancel a shift', async () => {
      const result = await controller.cancel(
        'shift-uuid', mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Shift cancelled');
    });
  });
});
