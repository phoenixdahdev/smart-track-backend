import { EvvComplianceService } from './evv-compliance.service';
import { PunchType } from '@enums/punch-type.enum';
import { CorrectionStatus } from '@enums/correction-status.enum';
import { ShiftStatus } from '@enums/shift-status.enum';

describe('EvvComplianceService', () => {
  let service: EvvComplianceService;
  let evvPunchDal: { find: jest.Mock };
  let evvCorrectionDal: { find: jest.Mock };
  let shiftDal: { find: jest.Mock };

  const mockPunch = (overrides: Record<string, unknown> = {}) => ({
    id: 'punch-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    shift_id: 'shift-uuid',
    punch_type: PunchType.CLOCK_IN,
    timestamp: '2026-03-15T08:00:00Z',
    location_confirmed: true,
    ...overrides,
  });

  const mockCorrection = (overrides: Record<string, unknown> = {}) => ({
    id: 'corr-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    status: CorrectionStatus.PENDING,
    requested_time: '2026-03-15T08:00:00Z',
    ...overrides,
  });

  const mockShift = (overrides: Record<string, unknown> = {}) => ({
    id: 'shift-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    shift_date: '2026-03-15',
    status: ShiftStatus.COMPLETED,
    ...overrides,
  });

  beforeEach(() => {
    evvPunchDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockPunch()] }),
    };
    evvCorrectionDal = {
      find: jest.fn().mockResolvedValue({ payload: [] }),
    };
    shiftDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockShift()] }),
    };

    service = new EvvComplianceService(
      evvPunchDal as never,
      evvCorrectionDal as never,
      shiftDal as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEvvComplianceReport', () => {
    it('should count punches by type', async () => {
      evvPunchDal.find.mockResolvedValue({
        payload: [
          mockPunch({ punch_type: PunchType.CLOCK_IN }),
          mockPunch({ id: 'p2', punch_type: PunchType.CLOCK_OUT }),
        ],
      });

      const result = await service.getEvvComplianceReport('org-uuid');

      expect(result.total_punches).toBe(2);
      expect(result.clock_in_count).toBe(1);
      expect(result.clock_out_count).toBe(1);
    });

    it('should calculate GPS confirmation rate', async () => {
      evvPunchDal.find.mockResolvedValue({
        payload: [
          mockPunch({ location_confirmed: true }),
          mockPunch({ id: 'p2', location_confirmed: false }),
        ],
      });

      const result = await service.getEvvComplianceReport('org-uuid');

      expect(result.gps_confirmed_count).toBe(1);
      expect(result.gps_confirmation_rate_percent).toBe(50);
    });

    it('should count corrections by status', async () => {
      evvCorrectionDal.find.mockResolvedValue({
        payload: [
          mockCorrection({ status: CorrectionStatus.APPROVED }),
          mockCorrection({ id: 'c2', status: CorrectionStatus.REJECTED }),
          mockCorrection({ id: 'c3', status: CorrectionStatus.PENDING }),
        ],
      });

      const result = await service.getEvvComplianceReport('org-uuid');

      expect(result.correction_count).toBe(3);
      expect(result.corrections_approved).toBe(1);
      expect(result.corrections_rejected).toBe(1);
      expect(result.corrections_pending).toBe(1);
    });

    it('should detect missed punches for completed shifts', async () => {
      evvPunchDal.find.mockResolvedValue({ payload: [] });
      shiftDal.find.mockResolvedValue({
        payload: [mockShift({ id: 'shift-no-punch' })],
      });

      const result = await service.getEvvComplianceReport('org-uuid');

      expect(result.missed_punch_count).toBe(1);
    });

    it('should not count missed punch when shift has matching punch', async () => {
      evvPunchDal.find.mockResolvedValue({
        payload: [mockPunch({ shift_id: 'shift-uuid' })],
      });
      shiftDal.find.mockResolvedValue({
        payload: [mockShift({ id: 'shift-uuid' })],
      });

      const result = await service.getEvvComplianceReport('org-uuid');

      expect(result.missed_punch_count).toBe(0);
    });

    it('should filter punches by date range', async () => {
      evvPunchDal.find.mockResolvedValue({
        payload: [
          mockPunch({ timestamp: '2026-01-01T08:00:00Z' }),
          mockPunch({ id: 'p2', timestamp: '2026-03-15T08:00:00Z' }),
        ],
      });

      const result = await service.getEvvComplianceReport('org-uuid', {
        date_from: '2026-03-01',
      });

      expect(result.total_punches).toBe(1);
    });

    it('should apply staff_id filter to DAL calls', async () => {
      await service.getEvvComplianceReport('org-uuid', { staff_id: 'staff-uuid' });

      expect(evvPunchDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ staff_id: 'staff-uuid' }) as unknown,
        }),
      );
    });

    it('should pass pagination limit to DAL calls', async () => {
      await service.getEvvComplianceReport('org-uuid');

      expect(evvPunchDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { limit: 50000, page: 1 },
        }),
      );
      expect(evvCorrectionDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { limit: 50000, page: 1 },
        }),
      );
      expect(shiftDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { limit: 50000, page: 1 },
        }),
      );
    });

    it('should return zeros for empty data', async () => {
      evvPunchDal.find.mockResolvedValue({ payload: [] });
      evvCorrectionDal.find.mockResolvedValue({ payload: [] });
      shiftDal.find.mockResolvedValue({ payload: [] });

      const result = await service.getEvvComplianceReport('org-uuid');

      expect(result.total_punches).toBe(0);
      expect(result.gps_confirmation_rate_percent).toBe(0);
      expect(result.missed_punch_count).toBe(0);
    });

    it('should filter corrections by date range', async () => {
      evvCorrectionDal.find.mockResolvedValue({
        payload: [
          mockCorrection({ requested_time: '2026-01-01T08:00:00Z' }),
          mockCorrection({ id: 'c2', requested_time: '2026-03-15T08:00:00Z' }),
        ],
      });

      const result = await service.getEvvComplianceReport('org-uuid', {
        date_from: '2026-03-01',
      });

      expect(result.correction_count).toBe(1);
    });

    it('should filter shifts by date range', async () => {
      evvPunchDal.find.mockResolvedValue({ payload: [] });
      shiftDal.find.mockResolvedValue({
        payload: [
          mockShift({ id: 's1', shift_date: '2026-01-01' }),
          mockShift({ id: 's2', shift_date: '2026-03-15' }),
        ],
      });

      const result = await service.getEvvComplianceReport('org-uuid', {
        date_from: '2026-03-01',
      });

      expect(result.missed_punch_count).toBe(1);
    });
  });
});
