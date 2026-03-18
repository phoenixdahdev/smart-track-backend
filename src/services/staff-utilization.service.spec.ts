import { StaffUtilizationService } from './staff-utilization.service';
import { PunchType } from '@enums/punch-type.enum';
import { ShiftStatus } from '@enums/shift-status.enum';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';

describe('StaffUtilizationService', () => {
  let service: StaffUtilizationService;
  let serviceRecordDal: { find: jest.Mock };
  let shiftDal: { find: jest.Mock };
  let evvPunchDal: { find: jest.Mock };
  let userDal: { find: jest.Mock };

  const mockRecord = (overrides: Record<string, unknown> = {}) => ({
    id: 'sr-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-1',
    program_id: 'prog-uuid',
    service_date: '2026-03-15',
    units_delivered: 4,
    status: ServiceRecordStatus.APPROVED,
    ...overrides,
  });

  const mockShift = (overrides: Record<string, unknown> = {}) => ({
    id: 'shift-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-1',
    shift_date: '2026-03-15',
    status: ShiftStatus.COMPLETED,
    ...overrides,
  });

  const mockPunch = (overrides: Record<string, unknown> = {}) => ({
    id: 'punch-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-1',
    punch_type: PunchType.CLOCK_IN,
    timestamp: '2026-03-15T08:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    serviceRecordDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockRecord()] }),
    };
    shiftDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockShift()] }),
    };
    evvPunchDal = {
      find: jest.fn().mockResolvedValue({
        payload: [
          mockPunch({ punch_type: PunchType.CLOCK_IN, timestamp: '2026-03-15T08:00:00Z' }),
          mockPunch({ id: 'p2', punch_type: PunchType.CLOCK_OUT, timestamp: '2026-03-15T16:00:00Z' }),
        ],
      }),
    };
    userDal = {
      find: jest.fn().mockResolvedValue({
        payload: [{ id: 'staff-1', name: 'John Doe' }],
      }),
    };

    service = new StaffUtilizationService(
      serviceRecordDal as never,
      shiftDal as never,
      evvPunchDal as never,
      userDal as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStaffUtilization', () => {
    it('should return per-staff utilization', async () => {
      const result = await service.getStaffUtilization('org-uuid');

      expect(result.staff).toHaveLength(1);
      expect(result.staff[0].staff_id).toBe('staff-1');
      expect(result.staff[0].staff_name).toBe('John Doe');
    });

    it('should calculate hours from paired punches', async () => {
      const result = await service.getStaffUtilization('org-uuid');

      expect(result.staff[0].hours_logged).toBe(8);
      expect(result.total_hours_logged).toBe(8);
    });

    it('should sum units delivered', async () => {
      const result = await service.getStaffUtilization('org-uuid');

      expect(result.staff[0].units_delivered).toBe(4);
      expect(result.total_units_delivered).toBe(4);
    });

    it('should calculate shift fulfillment rate', async () => {
      shiftDal.find.mockResolvedValue({
        payload: [
          mockShift({ id: 's1', status: ShiftStatus.COMPLETED }),
          mockShift({ id: 's2', status: ShiftStatus.CANCELLED }),
        ],
      });

      const result = await service.getStaffUtilization('org-uuid');

      expect(result.staff[0].shifts_scheduled).toBe(2);
      expect(result.staff[0].shifts_completed).toBe(1);
      expect(result.staff[0].shift_fulfillment_rate_percent).toBe(50);
    });

    it('should count submitted service records', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [
          mockRecord({ id: 'r1', status: ServiceRecordStatus.APPROVED }),
          mockRecord({ id: 'r2', status: ServiceRecordStatus.PENDING_REVIEW }),
          mockRecord({ id: 'r3', status: ServiceRecordStatus.DRAFT }),
        ],
      });

      const result = await service.getStaffUtilization('org-uuid');

      expect(result.staff[0].service_records_submitted).toBe(2);
    });

    it('should filter by date range', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [
          mockRecord({ id: 'r1', service_date: '2026-01-01' }),
          mockRecord({ id: 'r2', service_date: '2026-03-15' }),
        ],
      });
      shiftDal.find.mockResolvedValue({ payload: [] });
      evvPunchDal.find.mockResolvedValue({ payload: [] });

      const result = await service.getStaffUtilization('org-uuid', {
        date_from: '2026-03-01',
      });

      expect(result.staff[0].units_delivered).toBe(4);
    });

    it('should apply staff_id filter', async () => {
      await service.getStaffUtilization('org-uuid', { staff_id: 'staff-1' });

      expect(serviceRecordDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ staff_id: 'staff-1' }) as unknown,
        }),
      );
    });

    it('should pass pagination limit to DAL calls', async () => {
      await service.getStaffUtilization('org-uuid');

      expect(serviceRecordDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { limit: 50000, page: 1 },
        }),
      );
      expect(shiftDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { limit: 50000, page: 1 },
        }),
      );
      expect(evvPunchDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { limit: 50000, page: 1 },
        }),
      );
    });

    it('should handle multiple staff members', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [
          mockRecord({ staff_id: 'staff-1' }),
          mockRecord({ id: 'r2', staff_id: 'staff-2' }),
        ],
      });
      shiftDal.find.mockResolvedValue({ payload: [] });
      evvPunchDal.find.mockResolvedValue({ payload: [] });
      userDal.find.mockResolvedValue({
        payload: [
          { id: 'staff-1', name: 'Alice' },
          { id: 'staff-2', name: 'Bob' },
        ],
      });

      const result = await service.getStaffUtilization('org-uuid');

      expect(result.staff).toHaveLength(2);
      expect(result.avg_hours_per_staff).toBe(0);
    });

    it('should return empty report when no data', async () => {
      serviceRecordDal.find.mockResolvedValue({ payload: [] });
      shiftDal.find.mockResolvedValue({ payload: [] });
      evvPunchDal.find.mockResolvedValue({ payload: [] });

      const result = await service.getStaffUtilization('org-uuid');

      expect(result.staff).toHaveLength(0);
      expect(result.total_hours_logged).toBe(0);
      expect(result.avg_hours_per_staff).toBe(0);
    });

    it('should handle Unknown staff name when user not found', async () => {
      userDal.find.mockResolvedValue({ payload: [] });

      const result = await service.getStaffUtilization('org-uuid');

      expect(result.staff[0].staff_name).toBe('Unknown');
    });
  });
});
