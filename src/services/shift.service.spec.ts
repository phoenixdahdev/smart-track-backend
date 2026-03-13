import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ShiftService } from './shift.service';
import { ShiftStatus } from '@enums/shift-status.enum';

describe('ShiftService', () => {
  let service: ShiftService;
  let shiftDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let staffAssignmentDal: { get: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockShift = {
    id: 'shift-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    individual_id: 'ind-uuid',
    site_id: null,
    program_id: null,
    shift_date: '2026-03-15',
    start_time: '08:00',
    end_time: '16:00',
    status: ShiftStatus.DRAFT,
    created_by: 'creator-uuid',
    published_at: null,
    responded_at: null,
  };

  const mockAssignment = {
    id: 'assignment-uuid',
    staff_id: 'staff-uuid',
    individual_id: 'ind-uuid',
    org_id: 'org-uuid',
    active: true,
  };

  beforeEach(() => {
    shiftDal = {
      find: jest.fn().mockResolvedValue({ payload: [], paginationMeta: { total: 0 } }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockShift),
      update: jest.fn().mockResolvedValue(mockShift),
    };
    staffAssignmentDal = {
      get: jest.fn().mockResolvedValue(mockAssignment),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new ShiftService(
      shiftDal as never,
      staffAssignmentDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      staff_id: 'staff-uuid',
      individual_id: 'ind-uuid',
      shift_date: '2026-03-15',
      start_time: '08:00',
      end_time: '16:00',
    };

    it('should create a DRAFT shift', async () => {
      const result = await service.create(
        dto, 'org-uuid', 'creator-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('shift-uuid');
      expect(shiftDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            status: ShiftStatus.DRAFT,
            staff_id: 'staff-uuid',
          }) as unknown,
        }),
      );
    });

    it('should validate staff assignment', async () => {
      staffAssignmentDal.get.mockResolvedValue(null);

      await expect(
        service.create(dto, 'org-uuid', 'creator-uuid', 'SUPERVISOR', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when end_time <= start_time', async () => {
      const badDto = { ...dto, start_time: '16:00', end_time: '08:00' };

      await expect(
        service.create(badDto, 'org-uuid', 'creator-uuid', 'SUPERVISOR', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when times are equal', async () => {
      const badDto = { ...dto, start_time: '08:00', end_time: '08:00' };

      await expect(
        service.create(badDto, 'org-uuid', 'creator-uuid', 'SUPERVISOR', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should detect scheduling conflicts', async () => {
      shiftDal.find.mockResolvedValue({
        payload: [{ ...mockShift, id: 'other-shift', start_time: '07:00', end_time: '12:00', status: ShiftStatus.PUBLISHED }],
        paginationMeta: {},
      });

      await expect(
        service.create(dto, 'org-uuid', 'creator-uuid', 'SUPERVISOR', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should ignore terminal-status shifts in conflict check', async () => {
      shiftDal.find.mockResolvedValue({
        payload: [{ ...mockShift, id: 'other-shift', status: ShiftStatus.CANCELLED }],
        paginationMeta: {},
      });

      const result = await service.create(
        dto, 'org-uuid', 'creator-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('shift-uuid');
    });

    it('should log audit action', async () => {
      await service.create(dto, 'org-uuid', 'creator-uuid', 'SUPERVISOR', '127.0.0.1', 'jest');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SHIFT_CREATED',
          table_name: 'shifts',
        }),
      );
    });

    it('should pass optional site_id and program_id', async () => {
      const fullDto = { ...dto, site_id: 'site-uuid', program_id: 'prog-uuid' };

      await service.create(fullDto, 'org-uuid', 'creator-uuid', 'SUPERVISOR', '127.0.0.1', 'jest');

      expect(shiftDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            site_id: 'site-uuid',
            program_id: 'prog-uuid',
          }) as unknown,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return shift when found', async () => {
      shiftDal.get.mockResolvedValue(mockShift);

      const result = await service.findById('shift-uuid', 'org-uuid');
      expect(result.id).toBe('shift-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByIdForStaff', () => {
    it('should return shift when found for staff', async () => {
      shiftDal.get.mockResolvedValue(mockShift);

      const result = await service.findByIdForStaff('shift-uuid', 'org-uuid', 'staff-uuid');
      expect(result.id).toBe('shift-uuid');
    });

    it('should throw NotFoundException when staff mismatch', async () => {
      await expect(
        service.findByIdForStaff('shift-uuid', 'org-uuid', 'other-staff'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const dto = { start_time: '09:00' };

    it('should update a DRAFT shift', async () => {
      shiftDal.get.mockResolvedValue(mockShift);

      await service.update(
        'shift-uuid', 'org-uuid', dto, 'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(shiftDal.update).toHaveBeenCalled();
    });

    it('should reject update for non-DRAFT shift', async () => {
      shiftDal.get.mockResolvedValue({ ...mockShift, status: ShiftStatus.PUBLISHED });

      await expect(
        service.update('shift-uuid', 'org-uuid', dto, 'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should re-validate assignment when staff_id changes', async () => {
      shiftDal.get.mockResolvedValue(mockShift);

      await service.update(
        'shift-uuid', 'org-uuid', { staff_id: 'new-staff' },
        'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(staffAssignmentDal.get).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            staff_id: 'new-staff',
          }) as unknown,
        }),
      );
    });

    it('should reject update when end_time <= start_time', async () => {
      shiftDal.get.mockResolvedValue(mockShift);

      await expect(
        service.update(
          'shift-uuid', 'org-uuid', { start_time: '18:00' },
          'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should re-check conflicts when date/time changes', async () => {
      shiftDal.get.mockResolvedValue(mockShift);
      // First call for findById, second for conflict check
      shiftDal.find.mockResolvedValue({ payload: [], paginationMeta: {} });

      await service.update(
        'shift-uuid', 'org-uuid', { shift_date: '2026-03-16' },
        'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(shiftDal.find).toHaveBeenCalled();
    });

    it('should log audit action', async () => {
      shiftDal.get.mockResolvedValue(mockShift);

      await service.update(
        'shift-uuid', 'org-uuid', dto, 'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SHIFT_UPDATED',
        }),
      );
    });
  });

  describe('publish', () => {
    it('should publish a DRAFT shift', async () => {
      shiftDal.get.mockResolvedValue(mockShift);
      shiftDal.update.mockResolvedValue({ ...mockShift, status: ShiftStatus.PUBLISHED });

      const result = await service.publish(
        'shift-uuid', 'org-uuid', 'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(shiftDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ShiftStatus.PUBLISHED,
          }) as unknown,
        }),
      );
      expect(result.status).toBe(ShiftStatus.PUBLISHED);
    });

    it('should reject publish from invalid state', async () => {
      shiftDal.get.mockResolvedValue({ ...mockShift, status: ShiftStatus.ACCEPTED });

      await expect(
        service.publish('shift-uuid', 'org-uuid', 'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow re-publish from NO_RESPONSE', async () => {
      shiftDal.get.mockResolvedValue({ ...mockShift, status: ShiftStatus.NO_RESPONSE });
      shiftDal.update.mockResolvedValue({ ...mockShift, status: ShiftStatus.PUBLISHED });

      const result = await service.publish(
        'shift-uuid', 'org-uuid', 'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(result.status).toBe(ShiftStatus.PUBLISHED);
    });

    it('should log audit action', async () => {
      shiftDal.get.mockResolvedValue(mockShift);

      await service.publish('shift-uuid', 'org-uuid', 'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SHIFT_PUBLISHED',
        }),
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a DRAFT shift', async () => {
      shiftDal.get.mockResolvedValue(mockShift);
      shiftDal.update.mockResolvedValue({ ...mockShift, status: ShiftStatus.CANCELLED });

      const result = await service.cancel(
        'shift-uuid', 'org-uuid', 'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(result.status).toBe(ShiftStatus.CANCELLED);
    });

    it('should cancel a PUBLISHED shift', async () => {
      shiftDal.get.mockResolvedValue({ ...mockShift, status: ShiftStatus.PUBLISHED });
      shiftDal.update.mockResolvedValue({ ...mockShift, status: ShiftStatus.CANCELLED });

      await service.cancel(
        'shift-uuid', 'org-uuid', 'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest',
      );

      expect(shiftDal.update).toHaveBeenCalled();
    });

    it('should reject cancel from terminal state', async () => {
      shiftDal.get.mockResolvedValue({ ...mockShift, status: ShiftStatus.COMPLETED });

      await expect(
        service.cancel('shift-uuid', 'org-uuid', 'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log audit action', async () => {
      shiftDal.get.mockResolvedValue(mockShift);

      await service.cancel('shift-uuid', 'org-uuid', 'user-uuid', 'SUPERVISOR', '127.0.0.1', 'jest');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SHIFT_CANCELLED',
        }),
      );
    });
  });

  describe('accept', () => {
    it('should accept a PUBLISHED shift', async () => {
      const publishedShift = { ...mockShift, status: ShiftStatus.PUBLISHED };
      shiftDal.get.mockResolvedValue(publishedShift);
      shiftDal.update.mockResolvedValue({ ...publishedShift, status: ShiftStatus.ACCEPTED });

      const result = await service.accept(
        'shift-uuid', 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest',
      );

      expect(shiftDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ShiftStatus.ACCEPTED,
          }) as unknown,
        }),
      );
      expect(result.status).toBe(ShiftStatus.ACCEPTED);
    });

    it('should reject accept from non-PUBLISHED state', async () => {
      shiftDal.get.mockResolvedValue(mockShift);

      await expect(
        service.accept('shift-uuid', 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw 404 when shift not assigned to staff', async () => {
      await expect(
        service.accept('shift-uuid', 'org-uuid', 'wrong-staff', 'DSP', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit action', async () => {
      shiftDal.get.mockResolvedValue({ ...mockShift, status: ShiftStatus.PUBLISHED });

      await service.accept('shift-uuid', 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SHIFT_ACCEPTED',
        }),
      );
    });
  });

  describe('reject', () => {
    it('should reject a PUBLISHED shift', async () => {
      const publishedShift = { ...mockShift, status: ShiftStatus.PUBLISHED };
      shiftDal.get.mockResolvedValue(publishedShift);
      shiftDal.update.mockResolvedValue({ ...publishedShift, status: ShiftStatus.REJECTED });

      const result = await service.reject(
        'shift-uuid', 'org-uuid', 'staff-uuid', 'Scheduling conflict', 'DSP', '127.0.0.1', 'jest',
      );

      expect(result.status).toBe(ShiftStatus.REJECTED);
    });

    it('should reject from non-PUBLISHED state', async () => {
      shiftDal.get.mockResolvedValue(mockShift);

      await expect(
        service.reject('shift-uuid', 'org-uuid', 'staff-uuid', undefined, 'DSP', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log audit action with reason', async () => {
      shiftDal.get.mockResolvedValue({ ...mockShift, status: ShiftStatus.PUBLISHED });

      await service.reject(
        'shift-uuid', 'org-uuid', 'staff-uuid', 'Personal conflict', 'DSP', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SHIFT_REJECTED: Personal conflict',
        }),
      );
    });
  });

  describe('listAll', () => {
    it('should return all shifts for org', async () => {
      shiftDal.find.mockResolvedValue({
        payload: [mockShift],
        paginationMeta: { total: 1 },
      });

      const result = await service.listAll('org-uuid');
      expect(result.payload).toHaveLength(1);
    });

    it('should apply status filter', async () => {
      shiftDal.find.mockResolvedValue({ payload: [], paginationMeta: { total: 0 } });

      await service.listAll('org-uuid', undefined, { status: ShiftStatus.PUBLISHED });

      expect(shiftDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            status: ShiftStatus.PUBLISHED,
          }) as unknown,
        }),
      );
    });

    it('should filter by date range', async () => {
      shiftDal.find.mockResolvedValue({
        payload: [
          { ...mockShift, shift_date: '2026-03-10' },
          { ...mockShift, shift_date: '2026-03-20' },
        ],
        paginationMeta: { total: 2 },
      });

      const result = await service.listAll('org-uuid', undefined, {
        date_from: '2026-03-15',
        date_to: '2026-03-25',
      });

      expect(result.payload).toHaveLength(1);
    });
  });

  describe('listByStaff', () => {
    it('should return paginated shifts for staff', async () => {
      shiftDal.find.mockResolvedValue({
        payload: [mockShift],
        paginationMeta: { total: 1 },
      });

      const result = await service.listByStaff('staff-uuid', 'org-uuid');
      expect(result.payload).toHaveLength(1);
    });

    it('should apply status and date filters', async () => {
      shiftDal.find.mockResolvedValue({
        payload: [mockShift],
        paginationMeta: { total: 1 },
      });

      await service.listByStaff('staff-uuid', 'org-uuid', undefined, {
        status: ShiftStatus.ACCEPTED,
      });

      expect(shiftDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            status: ShiftStatus.ACCEPTED,
          }) as unknown,
        }),
      );
    });
  });

  describe('listByIndividual', () => {
    it('should return paginated shifts for individual', async () => {
      shiftDal.find.mockResolvedValue({
        payload: [mockShift],
        paginationMeta: { total: 1 },
      });

      const result = await service.listByIndividual('ind-uuid', 'org-uuid');
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('checkConflicts', () => {
    it('should find overlapping shifts', async () => {
      shiftDal.find.mockResolvedValue({
        payload: [{ ...mockShift, id: 'other-shift', start_time: '07:00', end_time: '12:00', status: ShiftStatus.PUBLISHED }],
        paginationMeta: {},
      });

      const conflicts = await service.checkConflicts(
        'org-uuid', 'staff-uuid', '2026-03-15', '08:00', '16:00',
      );

      expect(conflicts).toHaveLength(1);
    });

    it('should exclude the shift being updated', async () => {
      shiftDal.find.mockResolvedValue({
        payload: [{ ...mockShift, id: 'shift-uuid', status: ShiftStatus.DRAFT }],
        paginationMeta: {},
      });

      const conflicts = await service.checkConflicts(
        'org-uuid', 'staff-uuid', '2026-03-15', '08:00', '16:00', 'shift-uuid',
      );

      expect(conflicts).toHaveLength(0);
    });

    it('should exclude terminal-status shifts', async () => {
      shiftDal.find.mockResolvedValue({
        payload: [
          { ...mockShift, id: 'rej', status: ShiftStatus.REJECTED },
          { ...mockShift, id: 'can', status: ShiftStatus.CANCELLED },
          { ...mockShift, id: 'comp', status: ShiftStatus.COMPLETED },
        ],
        paginationMeta: {},
      });

      const conflicts = await service.checkConflicts(
        'org-uuid', 'staff-uuid', '2026-03-15', '08:00', '16:00',
      );

      expect(conflicts).toHaveLength(0);
    });

    it('should not flag non-overlapping shifts', async () => {
      shiftDal.find.mockResolvedValue({
        payload: [{ ...mockShift, id: 'other', start_time: '16:00', end_time: '20:00', status: ShiftStatus.PUBLISHED }],
        paginationMeta: {},
      });

      const conflicts = await service.checkConflicts(
        'org-uuid', 'staff-uuid', '2026-03-15', '08:00', '16:00',
      );

      expect(conflicts).toHaveLength(0);
    });
  });
});
