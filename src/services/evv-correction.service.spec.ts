import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EvvCorrectionService } from './evv-correction.service';
import { CorrectionStatus } from '@enums/correction-status.enum';
import { PunchType } from '@enums/punch-type.enum';

describe('EvvCorrectionService', () => {
  let service: EvvCorrectionService;
  let evvCorrectionDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let evvPunchDal: { create: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockCorrection = {
    id: 'corr-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    individual_id: 'ind-uuid',
    shift_id: null,
    punch_type: PunchType.CLOCK_IN,
    requested_time: new Date('2026-03-10T08:00:00Z'),
    reason: 'Forgot to clock in',
    status: CorrectionStatus.PENDING,
    reviewed_by: null,
    reviewed_at: null,
  };

  const mockPunch = {
    id: 'new-punch-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    individual_id: 'ind-uuid',
    punch_type: PunchType.CLOCK_IN,
    timestamp: new Date('2026-03-10T08:00:00Z'),
  };

  beforeEach(() => {
    evvCorrectionDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockCorrection],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockCorrection),
      update: jest.fn().mockResolvedValue({
        ...mockCorrection,
        status: CorrectionStatus.APPROVED,
      }),
    };
    evvPunchDal = {
      create: jest.fn().mockResolvedValue(mockPunch),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new EvvCorrectionService(
      evvCorrectionDal as never,
      evvPunchDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a correction request with PENDING status', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        punch_type: PunchType.CLOCK_IN,
        requested_time: '2026-03-10T08:00:00.000Z',
        reason: 'Forgot to clock in',
      };

      const result = await service.create(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(result.id).toBe('corr-uuid');
      expect(evvCorrectionDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            status: CorrectionStatus.PENDING,
            punch_type: PunchType.CLOCK_IN,
          }) as unknown,
        }),
      );
    });

    it('should log audit action', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        punch_type: PunchType.CLOCK_IN,
        requested_time: '2026-03-10T08:00:00.000Z',
        reason: 'Forgot to clock in',
      };

      await service.create(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EVV_CORRECTION_CREATED',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return correction when found', async () => {
      evvCorrectionDal.get.mockResolvedValue(mockCorrection);

      const result = await service.findById('corr-uuid', 'org-uuid');
      expect(result.id).toBe('corr-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listByStaff', () => {
    it('should return paginated corrections for staff', async () => {
      const result = await service.listByStaff('staff-uuid', 'org-uuid');
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('listPending', () => {
    it('should list PENDING corrections', async () => {
      const result = await service.listPending('org-uuid');

      expect(evvCorrectionDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            status: CorrectionStatus.PENDING,
          }) as unknown,
        }),
      );
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('approve', () => {
    it('should transition PENDING to APPROVED and create a punch', async () => {
      evvCorrectionDal.get.mockResolvedValue(mockCorrection);

      const result = await service.approve(
        'corr-uuid', 'org-uuid', 'supervisor-uuid', 'Looks good',
        'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(evvCorrectionDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: CorrectionStatus.APPROVED,
            reviewed_by: 'supervisor-uuid',
          }) as unknown,
        }),
      );
      expect(evvPunchDal.create).toHaveBeenCalled();
      expect(result.created_punch).toBeDefined();
    });

    it('should throw for already approved correction', async () => {
      evvCorrectionDal.get.mockResolvedValue({
        ...mockCorrection,
        status: CorrectionStatus.APPROVED,
      });

      await expect(
        service.approve(
          'corr-uuid', 'org-uuid', 'supervisor-uuid', 'Notes',
          'SUPERVISOR', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when correction not found', async () => {
      await expect(
        service.approve(
          'bad-id', 'org-uuid', 'supervisor-uuid', 'Notes',
          'SUPERVISOR', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    it('should transition PENDING to REJECTED', async () => {
      evvCorrectionDal.get.mockResolvedValue(mockCorrection);
      evvCorrectionDal.update.mockResolvedValue({
        ...mockCorrection,
        status: CorrectionStatus.REJECTED,
      });

      await service.reject(
        'corr-uuid', 'org-uuid', 'supervisor-uuid', 'Invalid',
        'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(evvCorrectionDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: CorrectionStatus.REJECTED,
          }) as unknown,
        }),
      );
    });

    it('should throw for already rejected correction', async () => {
      evvCorrectionDal.get.mockResolvedValue({
        ...mockCorrection,
        status: CorrectionStatus.REJECTED,
      });

      await expect(
        service.reject(
          'corr-uuid', 'org-uuid', 'supervisor-uuid', 'Notes',
          'SUPERVISOR', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('flagMissedPunch', () => {
    it('should create a correction on behalf of staff', async () => {
      const dto = {
        staff_id: 'staff-uuid',
        individual_id: 'ind-uuid',
        punch_type: PunchType.CLOCK_OUT,
        requested_time: '2026-03-10T17:00:00.000Z',
        reason: 'Staff forgot to clock out',
      };

      const result = await service.flagMissedPunch(
        dto, 'org-uuid', 'supervisor-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('corr-uuid');
      expect(evvCorrectionDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            staff_id: 'staff-uuid',
            status: CorrectionStatus.PENDING,
          }) as unknown,
        }),
      );
    });

    it('should log flagged missed punch', async () => {
      const dto = {
        staff_id: 'staff-uuid',
        individual_id: 'ind-uuid',
        punch_type: PunchType.CLOCK_OUT,
        requested_time: '2026-03-10T17:00:00.000Z',
        reason: 'Staff forgot to clock out',
      };

      await service.flagMissedPunch(
        dto, 'org-uuid', 'supervisor-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EVV_MISSED_PUNCH_FLAGGED',
        }),
      );
    });
  });
});
