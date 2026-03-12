import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServiceRecordService } from './service-record.service';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';

describe('ServiceRecordService', () => {
  let service: ServiceRecordService;
  let serviceRecordDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let staffAssignmentDal: { get: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockRecord = {
    id: 'sr-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    staff_id: 'staff-uuid',
    program_id: null,
    service_date: '2026-03-10',
    service_code_id: null,
    units_delivered: 4,
    status: ServiceRecordStatus.DRAFT,
    submitted_at: null,
    approved_by: null,
    approved_at: null,
    rejected_by: null,
    rejection_reason: null,
  };

  const mockAssignment = {
    id: 'assign-uuid',
    staff_id: 'staff-uuid',
    individual_id: 'ind-uuid',
    org_id: 'org-uuid',
    active: true,
  };

  beforeEach(() => {
    serviceRecordDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockRecord),
      update: jest.fn().mockResolvedValue(mockRecord),
    };
    staffAssignmentDal = {
      get: jest.fn().mockResolvedValue(mockAssignment),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new ServiceRecordService(
      serviceRecordDal as never,
      staffAssignmentDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a service record with DRAFT status', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        service_date: '2026-03-10',
        units_delivered: 4,
      };

      const result = await service.create(
        dto,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(staffAssignmentDal.get).toHaveBeenCalled();
      expect(serviceRecordDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            staff_id: 'staff-uuid',
            status: ServiceRecordStatus.DRAFT,
          }) as unknown,
        }),
      );
      expect(result.id).toBe('sr-uuid');
    });

    it('should throw if staff is not assigned to individual', async () => {
      staffAssignmentDal.get.mockResolvedValue(null);

      await expect(
        service.create(
          { individual_id: 'ind-uuid', service_date: '2026-03-10', units_delivered: 4 },
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log audit action on create', async () => {
      await service.create(
        { individual_id: 'ind-uuid', service_date: '2026-03-10', units_delivered: 4 },
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SERVICE_RECORD_CREATED' }),
      );
    });
  });

  describe('findById', () => {
    it('should return a record when found', async () => {
      serviceRecordDal.get.mockResolvedValue(mockRecord);

      const result = await service.findById('sr-uuid', 'org-uuid');
      expect(result.id).toBe('sr-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      serviceRecordDal.get.mockResolvedValue(null);

      await expect(service.findById('bad-id', 'org-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a DRAFT record', async () => {
      serviceRecordDal.get.mockResolvedValue(mockRecord);

      await service.update(
        'sr-uuid',
        'org-uuid',
        'staff-uuid',
        { units_delivered: 6 },
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(serviceRecordDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({ units_delivered: 6 }) as unknown,
        }),
      );
    });

    it('should throw BadRequestException when updating an APPROVED record', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockRecord,
        status: ServiceRecordStatus.APPROVED,
      });

      await expect(
        service.update(
          'sr-uuid',
          'org-uuid',
          'staff-uuid',
          { units_delivered: 6 },
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when updating a PENDING_REVIEW record', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockRecord,
        status: ServiceRecordStatus.PENDING_REVIEW,
      });

      await expect(
        service.update(
          'sr-uuid',
          'org-uuid',
          'staff-uuid',
          { units_delivered: 6 },
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow update on REJECTED record', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockRecord,
        status: ServiceRecordStatus.REJECTED,
      });

      await service.update(
        'sr-uuid',
        'org-uuid',
        'staff-uuid',
        { units_delivered: 6 },
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(serviceRecordDal.update).toHaveBeenCalled();
    });
  });

  describe('submitForReview', () => {
    it('should transition DRAFT to PENDING_REVIEW', async () => {
      serviceRecordDal.get.mockResolvedValue(mockRecord);

      await service.submitForReview(
        'sr-uuid',
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(serviceRecordDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ServiceRecordStatus.PENDING_REVIEW,
          }) as unknown,
        }),
      );
    });

    it('should throw when trying to submit an APPROVED record', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockRecord,
        status: ServiceRecordStatus.APPROVED,
      });

      await expect(
        service.submitForReview(
          'sr-uuid',
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('should transition PENDING_REVIEW to APPROVED', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockRecord,
        status: ServiceRecordStatus.PENDING_REVIEW,
      });

      await service.approve(
        'sr-uuid',
        'org-uuid',
        'supervisor-uuid',
        'SUPERVISOR',
        '127.0.0.1',
        'jest',
      );

      expect(serviceRecordDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ServiceRecordStatus.APPROVED,
            approved_by: 'supervisor-uuid',
          }) as unknown,
        }),
      );
    });

    it('should throw when trying to approve a DRAFT record', async () => {
      serviceRecordDal.get.mockResolvedValue(mockRecord);

      await expect(
        service.approve(
          'sr-uuid',
          'org-uuid',
          'supervisor-uuid',
          'SUPERVISOR',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log audit action on approval', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockRecord,
        status: ServiceRecordStatus.PENDING_REVIEW,
      });

      await service.approve(
        'sr-uuid',
        'org-uuid',
        'supervisor-uuid',
        'SUPERVISOR',
        '127.0.0.1',
        'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SERVICE_RECORD_APPROVED' }),
      );
    });
  });

  describe('reject', () => {
    it('should transition PENDING_REVIEW to REJECTED with reason', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockRecord,
        status: ServiceRecordStatus.PENDING_REVIEW,
      });

      await service.reject(
        'sr-uuid',
        'org-uuid',
        'supervisor-uuid',
        'Missing documentation',
        'SUPERVISOR',
        '127.0.0.1',
        'jest',
      );

      expect(serviceRecordDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ServiceRecordStatus.REJECTED,
            rejected_by: 'supervisor-uuid',
            rejection_reason: 'Missing documentation',
          }) as unknown,
        }),
      );
    });

    it('should throw when trying to reject a DRAFT record', async () => {
      serviceRecordDal.get.mockResolvedValue(mockRecord);

      await expect(
        service.reject(
          'sr-uuid',
          'org-uuid',
          'supervisor-uuid',
          'reason',
          'SUPERVISOR',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listPendingReview', () => {
    it('should list PENDING_REVIEW records for org', async () => {
      const result = await service.listPendingReview('org-uuid');

      expect(serviceRecordDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            status: ServiceRecordStatus.PENDING_REVIEW,
          }) as unknown,
        }),
      );
      expect(result.payload).toHaveLength(1);
    });
  });
});
