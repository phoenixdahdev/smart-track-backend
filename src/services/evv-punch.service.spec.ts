import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EvvPunchService } from './evv-punch.service';
import { PunchType } from '@enums/punch-type.enum';

describe('EvvPunchService', () => {
  let service: EvvPunchService;
  let evvPunchDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let staffAssignmentDal: { get: jest.Mock };
  let siteDal: { find: jest.Mock };
  let serviceRecordDal: { get: jest.Mock; update: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockPunchIn = {
    id: 'punch-in-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    individual_id: 'ind-uuid',
    shift_id: null,
    punch_type: PunchType.CLOCK_IN,
    timestamp: new Date('2026-03-10T08:00:00Z'),
    gps_latitude: 40.7128,
    gps_longitude: -74.006,
    location_confirmed: true,
    device_id: 'device-1',
    notes: null,
  };

  const mockPunchOut = {
    ...mockPunchIn,
    id: 'punch-out-uuid',
    punch_type: PunchType.CLOCK_OUT,
    timestamp: new Date('2026-03-10T16:00:00Z'),
  };

  const mockAssignment = {
    id: 'assignment-uuid',
    staff_id: 'staff-uuid',
    individual_id: 'ind-uuid',
    org_id: 'org-uuid',
    active: true,
  };

  const mockSite = {
    id: 'site-uuid',
    org_id: 'org-uuid',
    latitude: 40.7128,
    longitude: -74.006,
    active: true,
  };

  const mockServiceRecord = {
    id: 'sr-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    individual_id: 'ind-uuid',
    evv_punch_in_id: null,
    evv_punch_out_id: null,
  };

  beforeEach(() => {
    evvPunchDal = {
      find: jest.fn().mockResolvedValue({ payload: [], paginationMeta: { total: 0 } }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockPunchIn),
      update: jest.fn().mockResolvedValue(mockPunchIn),
    };
    staffAssignmentDal = {
      get: jest.fn().mockResolvedValue(mockAssignment),
    };
    siteDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockSite] }),
    };
    serviceRecordDal = {
      get: jest.fn().mockResolvedValue(mockServiceRecord),
      update: jest.fn().mockResolvedValue({
        ...mockServiceRecord,
        evv_punch_in_id: 'punch-in-uuid',
        evv_punch_out_id: 'punch-out-uuid',
      }),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new EvvPunchService(
      evvPunchDal as never,
      staffAssignmentDal as never,
      siteDal as never,
      serviceRecordDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('clockIn', () => {
    const dto = { individual_id: 'ind-uuid', gps_latitude: 40.7128, gps_longitude: -74.006 };

    it('should create a clock-in punch', async () => {
      const result = await service.clockIn(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(result.id).toBe('punch-in-uuid');
      expect(evvPunchDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            punch_type: PunchType.CLOCK_IN,
            staff_id: 'staff-uuid',
          }) as unknown,
        }),
      );
    });

    it('should validate staff assignment', async () => {
      staffAssignmentDal.get.mockResolvedValue(null);

      await expect(
        service.clockIn(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent double clock-in', async () => {
      evvPunchDal.find
        .mockResolvedValueOnce({ payload: [mockPunchIn], paginationMeta: {} })
        .mockResolvedValueOnce({ payload: [], paginationMeta: {} });

      await expect(
        service.clockIn(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set location_confirmed true when within geofence', async () => {
      await service.clockIn(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(evvPunchDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            location_confirmed: true,
          }) as unknown,
        }),
      );
    });

    it('should set location_confirmed false when no GPS provided', async () => {
      const noGpsDto = { individual_id: 'ind-uuid' };

      await service.clockIn(noGpsDto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(evvPunchDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            location_confirmed: false,
          }) as unknown,
        }),
      );
    });

    it('should set location_confirmed false when outside geofence', async () => {
      siteDal.find.mockResolvedValue({
        payload: [{ ...mockSite, latitude: 0, longitude: 0 }],
      });

      await service.clockIn(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(evvPunchDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            location_confirmed: false,
          }) as unknown,
        }),
      );
    });

    it('should log audit action', async () => {
      await service.clockIn(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EVV_CLOCK_IN',
          table_name: 'evv_punches',
        }),
      );
    });

    it('should pass shift_id when provided', async () => {
      const withShift = { ...dto, shift_id: 'shift-uuid' };

      await service.clockIn(withShift, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(evvPunchDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            shift_id: 'shift-uuid',
          }) as unknown,
        }),
      );
    });
  });

  describe('clockOut', () => {
    const dto = { individual_id: 'ind-uuid', gps_latitude: 40.7128, gps_longitude: -74.006 };

    it('should create a clock-out punch', async () => {
      evvPunchDal.find
        .mockResolvedValueOnce({ payload: [mockPunchIn], paginationMeta: {} })
        .mockResolvedValueOnce({ payload: [], paginationMeta: {} });
      evvPunchDal.create.mockResolvedValue(mockPunchOut);

      const result = await service.clockOut(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(result.punch_type).toBe(PunchType.CLOCK_OUT);
      expect(evvPunchDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            punch_type: PunchType.CLOCK_OUT,
          }) as unknown,
        }),
      );
    });

    it('should throw when no open clock-in exists', async () => {
      await expect(
        service.clockOut(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should inherit shift_id from open clock-in when not provided', async () => {
      const clockInWithShift = { ...mockPunchIn, shift_id: 'shift-uuid' };
      evvPunchDal.find
        .mockResolvedValueOnce({ payload: [clockInWithShift], paginationMeta: {} })
        .mockResolvedValueOnce({ payload: [], paginationMeta: {} });
      evvPunchDal.create.mockResolvedValue(mockPunchOut);

      await service.clockOut({ individual_id: 'ind-uuid' }, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(evvPunchDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            shift_id: 'shift-uuid',
          }) as unknown,
        }),
      );
    });

    it('should log audit action for clock-out', async () => {
      evvPunchDal.find
        .mockResolvedValueOnce({ payload: [mockPunchIn], paginationMeta: {} })
        .mockResolvedValueOnce({ payload: [], paginationMeta: {} });
      evvPunchDal.create.mockResolvedValue(mockPunchOut);

      await service.clockOut(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EVV_CLOCK_OUT',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return punch when found', async () => {
      evvPunchDal.get.mockResolvedValue(mockPunchIn);

      const result = await service.findById('punch-in-uuid', 'org-uuid');
      expect(result.id).toBe('punch-in-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByIdForStaff', () => {
    it('should return punch when found for staff', async () => {
      evvPunchDal.get.mockResolvedValue(mockPunchIn);

      const result = await service.findByIdForStaff('punch-in-uuid', 'org-uuid', 'staff-uuid');
      expect(result.id).toBe('punch-in-uuid');
    });

    it('should throw NotFoundException when staff mismatch', async () => {
      await expect(
        service.findByIdForStaff('punch-in-uuid', 'org-uuid', 'other-staff'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listByStaff', () => {
    it('should return paginated punches for staff', async () => {
      evvPunchDal.find.mockResolvedValue({
        payload: [mockPunchIn],
        paginationMeta: { total: 1 },
      });

      const result = await service.listByStaff('staff-uuid', 'org-uuid');
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('listByIndividual', () => {
    it('should return paginated punches for individual', async () => {
      evvPunchDal.find.mockResolvedValue({
        payload: [mockPunchIn],
        paginationMeta: { total: 1 },
      });

      const result = await service.listByIndividual('ind-uuid', 'org-uuid');
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('listAll', () => {
    it('should return all punches for org', async () => {
      evvPunchDal.find.mockResolvedValue({
        payload: [mockPunchIn],
        paginationMeta: { total: 1 },
      });

      const result = await service.listAll('org-uuid');
      expect(result.payload).toHaveLength(1);
    });

    it('should apply filters when provided', async () => {
      evvPunchDal.find.mockResolvedValue({ payload: [], paginationMeta: { total: 0 } });

      await service.listAll('org-uuid', undefined, {
        staff_id: 'staff-uuid',
        punch_type: PunchType.CLOCK_IN,
      });

      expect(evvPunchDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            staff_id: 'staff-uuid',
            punch_type: PunchType.CLOCK_IN,
          }) as unknown,
        }),
      );
    });
  });

  describe('findMissedPunches', () => {
    it('should return clock-ins without matching clock-outs past threshold', async () => {
      const oldClockIn = {
        ...mockPunchIn,
        timestamp: new Date('2026-03-09T08:00:00Z'),
      };
      evvPunchDal.find
        .mockResolvedValueOnce({ payload: [oldClockIn], paginationMeta: {} })
        .mockResolvedValueOnce({ payload: [], paginationMeta: {} });

      const result = await service.findMissedPunches('org-uuid', 12);
      expect(result).toHaveLength(1);
    });

    it('should not include clock-ins with matching clock-outs', async () => {
      const oldClockIn = {
        ...mockPunchIn,
        timestamp: new Date('2026-03-09T08:00:00Z'),
      };
      const matchingClockOut = {
        ...mockPunchOut,
        timestamp: new Date('2026-03-09T16:00:00Z'),
      };
      evvPunchDal.find
        .mockResolvedValueOnce({ payload: [oldClockIn], paginationMeta: {} })
        .mockResolvedValueOnce({ payload: [matchingClockOut], paginationMeta: {} });

      const result = await service.findMissedPunches('org-uuid', 12);
      expect(result).toHaveLength(0);
    });
  });

  describe('linkToServiceRecord', () => {
    it('should link punches to service record', async () => {
      evvPunchDal.get
        .mockResolvedValueOnce(mockPunchIn)
        .mockResolvedValueOnce(mockPunchOut);

      await service.linkToServiceRecord(
        'sr-uuid', 'punch-in-uuid', 'punch-out-uuid',
        'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest',
      );

      expect(serviceRecordDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            evv_punch_in_id: 'punch-in-uuid',
            evv_punch_out_id: 'punch-out-uuid',
          }) as unknown,
        }),
      );
    });

    it('should throw when service record not found', async () => {
      serviceRecordDal.get.mockResolvedValue(null);

      await expect(
        service.linkToServiceRecord(
          'bad-id', 'punch-in-uuid', 'punch-out-uuid',
          'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when punch-in not found', async () => {
      evvPunchDal.get.mockResolvedValue(null);

      await expect(
        service.linkToServiceRecord(
          'sr-uuid', 'bad-id', 'punch-out-uuid',
          'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when punch type mismatch', async () => {
      evvPunchDal.get.mockResolvedValue(mockPunchOut);

      await expect(
        service.linkToServiceRecord(
          'sr-uuid', 'punch-out-uuid', 'punch-out-uuid',
          'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when staff does not match service record', async () => {
      const wrongStaffPunch = { ...mockPunchIn, staff_id: 'other-staff' };
      evvPunchDal.get
        .mockResolvedValueOnce(wrongStaffPunch)
        .mockResolvedValueOnce(mockPunchOut);

      await expect(
        service.linkToServiceRecord(
          'sr-uuid', 'punch-in-uuid', 'punch-out-uuid',
          'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSummary', () => {
    it('should return aggregate stats', async () => {
      evvPunchDal.find.mockResolvedValue({
        payload: [
          { ...mockPunchIn, location_confirmed: true },
          { ...mockPunchOut, location_confirmed: false },
        ],
        paginationMeta: {},
      });

      const result = await service.getSummary('org-uuid');

      expect(result.total_punches).toBe(2);
      expect(result.clock_ins).toBe(1);
      expect(result.clock_outs).toBe(1);
      expect(result.location_confirmation_rate).toBe(50);
    });

    it('should return zero rates when no punches', async () => {
      evvPunchDal.find.mockResolvedValue({ payload: [], paginationMeta: {} });

      const result = await service.getSummary('org-uuid');

      expect(result.total_punches).toBe(0);
      expect(result.location_confirmation_rate).toBe(0);
    });
  });
});
