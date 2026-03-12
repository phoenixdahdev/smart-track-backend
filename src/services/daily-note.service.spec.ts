import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DailyNoteService } from './daily-note.service';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';

const mockEncrypt = jest.fn((v: string) => `ENC(${v})`);
const mockDecrypt = jest.fn((v: string) => v.replace(/^ENC\((.+)\)$/, '$1'));

describe('DailyNoteService', () => {
  let service: DailyNoteService;
  let dailyNoteDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let serviceRecordDal: { get: jest.Mock };
  let encryptionService: { encrypt: jest.Mock; decrypt: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockServiceRecord = {
    id: 'sr-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    status: ServiceRecordStatus.DRAFT,
  };

  const mockNote = {
    id: 'note-uuid',
    org_id: 'org-uuid',
    service_record_id: 'sr-uuid',
    content: 'ENC(Note content)',
    observations: 'ENC(Some observations)',
    submitted_at: null,
    approved_at: null,
  };

  beforeEach(() => {
    dailyNoteDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockNote],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockNote),
      update: jest.fn().mockResolvedValue(mockNote),
    };
    serviceRecordDal = {
      get: jest.fn().mockResolvedValue(mockServiceRecord),
    };
    encryptionService = {
      encrypt: mockEncrypt,
      decrypt: mockDecrypt,
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new DailyNoteService(
      dailyNoteDal as never,
      serviceRecordDal as never,
      encryptionService as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should encrypt PHI fields and create a daily note', async () => {
      const dto = { content: 'Note content', observations: 'Some observations' };

      await service.create(
        'sr-uuid',
        dto,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(mockEncrypt).toHaveBeenCalledWith('Note content');
      expect(mockEncrypt).toHaveBeenCalledWith('Some observations');
      expect(dailyNoteDal.create).toHaveBeenCalled();
    });

    it('should throw if service record not found', async () => {
      serviceRecordDal.get.mockResolvedValue(null);

      await expect(
        service.create(
          'bad-sr',
          { content: 'test' },
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if service record is APPROVED', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockServiceRecord,
        status: ServiceRecordStatus.APPROVED,
      });

      await expect(
        service.create(
          'sr-uuid',
          { content: 'test' },
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
        'sr-uuid',
        { content: 'test' },
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DAILY_NOTE_CREATED' }),
      );
    });
  });

  describe('findByServiceRecord', () => {
    it('should return decrypted notes', async () => {
      const result = await service.findByServiceRecord('sr-uuid', 'org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(mockDecrypt).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return decrypted note and log PHI access', async () => {
      dailyNoteDal.get.mockResolvedValue(mockNote);

      const result = await service.findById(
        'note-uuid',
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(result.id).toBe('note-uuid');
      expect(mockDecrypt).toHaveBeenCalled();
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DAILY_NOTE_ACCESSED' }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      dailyNoteDal.get.mockResolvedValue(null);

      await expect(
        service.findById(
          'bad-id',
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should encrypt updated PHI fields', async () => {
      dailyNoteDal.get.mockResolvedValue(mockNote);

      await service.update(
        'note-uuid',
        'sr-uuid',
        'org-uuid',
        { content: 'Updated content' },
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(mockEncrypt).toHaveBeenCalledWith('Updated content');
      expect(dailyNoteDal.update).toHaveBeenCalled();
    });
  });
});
