import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CorrectionRequestService } from './correction-request.service';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import { CorrectionStatus } from '@enums/correction-status.enum';

describe('CorrectionRequestService', () => {
  let service: CorrectionRequestService;
  let correctionRequestDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let serviceRecordDal: { get: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockRequest = {
    id: 'cr-uuid',
    org_id: 'org-uuid',
    service_record_id: 'sr-uuid',
    requested_by: 'staff-uuid',
    requested_changes: 'Fix units',
    status: CorrectionStatus.PENDING,
    reviewed_by: null,
    reviewed_at: null,
    reviewer_notes: null,
  };

  const mockApprovedRecord = {
    id: 'sr-uuid',
    org_id: 'org-uuid',
    status: ServiceRecordStatus.APPROVED,
  };

  beforeEach(() => {
    correctionRequestDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockRequest],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockRequest),
      update: jest.fn().mockResolvedValue(mockRequest),
    };
    serviceRecordDal = {
      get: jest.fn().mockResolvedValue(mockApprovedRecord),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new CorrectionRequestService(
      correctionRequestDal as never,
      serviceRecordDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create correction request for APPROVED record', async () => {
      const dto = {
        service_record_id: 'sr-uuid',
        requested_changes: 'Fix units',
      };

      const result = await service.create(
        dto,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(result.id).toBe('cr-uuid');
      expect(correctionRequestDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            status: CorrectionStatus.PENDING,
          }) as unknown,
        }),
      );
    });

    it('should throw when service record is not APPROVED', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockApprovedRecord,
        status: ServiceRecordStatus.DRAFT,
      });

      await expect(
        service.create(
          { service_record_id: 'sr-uuid', requested_changes: 'Fix' },
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when service record not found', async () => {
      serviceRecordDal.get.mockResolvedValue(null);

      await expect(
        service.create(
          { service_record_id: 'bad-id', requested_changes: 'Fix' },
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should transition PENDING to APPROVED', async () => {
      correctionRequestDal.get.mockResolvedValue(mockRequest);

      await service.approve(
        'cr-uuid',
        'org-uuid',
        'supervisor-uuid',
        'Approved',
        'SUPERVISOR',
        '127.0.0.1',
        'jest',
      );

      expect(correctionRequestDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: CorrectionStatus.APPROVED,
            reviewed_by: 'supervisor-uuid',
          }) as unknown,
        }),
      );
    });

    it('should throw for already approved request', async () => {
      correctionRequestDal.get.mockResolvedValue({
        ...mockRequest,
        status: CorrectionStatus.APPROVED,
      });

      await expect(
        service.approve(
          'cr-uuid',
          'org-uuid',
          'supervisor-uuid',
          'Approved',
          'SUPERVISOR',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should transition PENDING to REJECTED', async () => {
      correctionRequestDal.get.mockResolvedValue(mockRequest);

      await service.reject(
        'cr-uuid',
        'org-uuid',
        'supervisor-uuid',
        'Not valid',
        'SUPERVISOR',
        '127.0.0.1',
        'jest',
      );

      expect(correctionRequestDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: CorrectionStatus.REJECTED,
          }) as unknown,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException when not found', async () => {
      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listPending', () => {
    it('should list PENDING correction requests', async () => {
      const result = await service.listPending('org-uuid');

      expect(correctionRequestDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            status: CorrectionStatus.PENDING,
          }) as unknown,
        }),
      );
      expect(result.payload).toHaveLength(1);
    });
  });
});
