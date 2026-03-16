import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SignupApplicationService } from './signup-application.service';
import { ApplicationStatus } from '@enums/application-status.enum';

describe('SignupApplicationService', () => {
  let service: SignupApplicationService;
  let applicationDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let documentDal: { get: jest.Mock; find: jest.Mock; update: jest.Mock };
  let noteDal: { find: jest.Mock; create: jest.Mock };
  let auditLogService: { logPlatformAction: jest.Mock };
  let riskScoringService: { calculateRiskScore: jest.Mock };

  const mockApplication = {
    id: 'app-uuid',
    org_name: 'Test Agency',
    npi: '1234567890',
    ein: '123456789',
    contact_name: 'John Doe',
    contact_email: 'john@testagency.com',
    contact_phone: null,
    status: ApplicationStatus.SUBMITTED,
    plan_tier: 'STARTER',
    risk_score: 1,
    reviewed_by: null,
    submitted_at: new Date(),
  };

  const mockNote = {
    id: 'note-uuid',
    application_id: 'app-uuid',
    operator_id: 'op-uuid',
    note_text: 'Test note',
  };

  const mockDoc = {
    id: 'doc-uuid',
    application_id: 'app-uuid',
    doc_type: 'NPI_CERT',
    verified: false,
  };

  beforeEach(() => {
    applicationDal = {
      get: jest.fn().mockResolvedValue(mockApplication),
      find: jest.fn().mockResolvedValue({
        payload: [mockApplication],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockApplication),
      update: jest.fn().mockResolvedValue(mockApplication),
    };
    documentDal = {
      get: jest.fn().mockResolvedValue(mockDoc),
      find: jest.fn().mockResolvedValue({ payload: [mockDoc], paginationMeta: { total: 1 } }),
      update: jest.fn().mockResolvedValue({ ...mockDoc, verified: true }),
    };
    noteDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockNote], paginationMeta: { total: 1 } }),
      create: jest.fn().mockResolvedValue(mockNote),
    };
    auditLogService = { logPlatformAction: jest.fn().mockResolvedValue(undefined) };
    riskScoringService = {
      calculateRiskScore: jest.fn().mockReturnValue({ score: 'LOW', factors: [] }),
    };

    service = new SignupApplicationService(
      applicationDal as never,
      documentDal as never,
      noteDal as never,
      auditLogService as never,
      riskScoringService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submit', () => {
    it('should create an application with risk score', async () => {
      const dto = {
        org_name: 'Test Agency',
        npi: '1234567890',
        ein: '123456789',
        contact_name: 'John Doe',
        contact_email: 'john@testagency.com',
      };

      const result = await service.submit(dto);

      expect(result.id).toBe('app-uuid');
      expect(result.risk.score).toBe('LOW');
      expect(riskScoringService.calculateRiskScore).toHaveBeenCalled();
      expect(applicationDal.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return an application when found', async () => {
      const result = await service.findById('app-uuid');
      expect(result.id).toBe('app-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      applicationDal.get.mockResolvedValue(null);
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated applications', async () => {
      const result = await service.list();
      expect(result.payload).toHaveLength(1);
    });

    it('should apply status filter', async () => {
      await service.list(undefined, { status: ApplicationStatus.UNDER_REVIEW });

      expect(applicationDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ status: ApplicationStatus.UNDER_REVIEW }) as unknown,
        }),
      );
    });
  });

  describe('transition', () => {
    it('should transition SUBMITTED to UNDER_REVIEW', async () => {
      await service.transition('app-uuid', ApplicationStatus.UNDER_REVIEW, 'op-uuid');

      expect(applicationDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({ status: ApplicationStatus.UNDER_REVIEW }) as unknown,
        }),
      );
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'APPLICATION_UNDER_REVIEW' }),
      );
    });

    it('should throw BadRequestException for invalid transition', async () => {
      await expect(
        service.transition('app-uuid', ApplicationStatus.ACTIVE, 'op-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set decision_at and rejection_reason when rejecting', async () => {
      await service.transition('app-uuid', ApplicationStatus.REJECTED, 'op-uuid', 'Incomplete docs');

      expect(applicationDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: ApplicationStatus.REJECTED,
            rejection_reason: 'Incomplete docs',
            decision_at: expect.any(Date) as unknown,
          }) as unknown,
        }),
      );
    });

    it('should set decision_at when approving', async () => {
      applicationDal.get.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.UNDER_REVIEW,
      });

      await service.transition('app-uuid', ApplicationStatus.APPROVED, 'op-uuid');

      expect(applicationDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            decision_at: expect.any(Date) as unknown,
          }) as unknown,
        }),
      );
    });
  });

  describe('assign', () => {
    it('should assign a reviewer', async () => {
      await service.assign('app-uuid', 'reviewer-uuid', 'op-uuid', '127.0.0.1', 'jest');

      expect(applicationDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({ reviewed_by: 'reviewer-uuid' }) as unknown,
        }),
      );
    });
  });

  describe('addNote', () => {
    it('should add a note to an application', async () => {
      const result = await service.addNote('app-uuid', 'op-uuid', 'Test note', '127.0.0.1', 'jest');

      expect(result.note_text).toBe('Test note');
      expect(noteDal.create).toHaveBeenCalled();
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'APPLICATION_NOTE_ADDED' }),
      );
    });
  });

  describe('getNotes', () => {
    it('should return notes for an application', async () => {
      const result = await service.getNotes('app-uuid');
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('getDocuments', () => {
    it('should return documents for an application', async () => {
      const result = await service.getDocuments('app-uuid');
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('verifyDocument', () => {
    it('should verify a document', async () => {
      const result = await service.verifyDocument('doc-uuid', true, 'op-uuid', 'Looks good');

      expect(result.verified).toBe(true);
      expect(documentDal.update).toHaveBeenCalled();
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DOCUMENT_VERIFIED' }),
      );
    });

    it('should throw NotFoundException when document not found', async () => {
      documentDal.get.mockResolvedValue(null);

      await expect(
        service.verifyDocument('bad-id', true, 'op-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummaryCounts', () => {
    it('should return counts by status', async () => {
      const result = await service.getSummaryCounts();

      expect(result).toBeDefined();
      expect(typeof result.SUBMITTED).toBe('number');
    });
  });
});
