import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdlEntryService } from './adl-entry.service';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import { AssistanceLevel } from '@enums/assistance-level.enum';

const mockEncrypt = jest.fn((v: string) => `ENC(${v})`);
const mockDecrypt = jest.fn((v: string) => v.replace(/^ENC\((.+)\)$/, '$1'));

describe('AdlEntryService', () => {
  let service: AdlEntryService;
  let adlEntryDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let serviceRecordDal: { get: jest.Mock };
  let adlCategoryDal: { get: jest.Mock };
  let encryptionService: { encrypt: jest.Mock; decrypt: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockServiceRecord = {
    id: 'sr-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    status: ServiceRecordStatus.DRAFT,
  };

  const mockCategory = {
    id: 'cat-uuid',
    org_id: 'org-uuid',
    name: 'Bathing',
    active: true,
  };

  const mockEntry = {
    id: 'entry-uuid',
    org_id: 'org-uuid',
    service_record_id: 'sr-uuid',
    individual_id: 'ind-uuid',
    staff_id: 'staff-uuid',
    adl_category_id: 'cat-uuid',
    assistance_level: AssistanceLevel.VERBAL_PROMPT,
    notes: 'ENC(Some notes)',
    recorded_at: new Date('2026-03-15'),
  };

  beforeEach(() => {
    adlEntryDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockEntry],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockEntry),
      update: jest.fn().mockResolvedValue(mockEntry),
    };
    serviceRecordDal = {
      get: jest.fn().mockResolvedValue(mockServiceRecord),
    };
    adlCategoryDal = {
      get: jest.fn().mockResolvedValue(mockCategory),
    };
    encryptionService = {
      encrypt: mockEncrypt,
      decrypt: mockDecrypt,
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new AdlEntryService(
      adlEntryDal as never,
      serviceRecordDal as never,
      adlCategoryDal as never,
      encryptionService as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      service_record_id: 'sr-uuid',
      individual_id: 'ind-uuid',
      adl_category_id: 'cat-uuid',
      assistance_level: AssistanceLevel.VERBAL_PROMPT,
      notes: 'Some notes',
    };

    it('should encrypt notes and create an ADL entry', async () => {
      await service.create(
        createDto,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(mockEncrypt).toHaveBeenCalledWith('Some notes');
      expect(adlEntryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            service_record_id: 'sr-uuid',
            individual_id: 'ind-uuid',
            adl_category_id: 'cat-uuid',
            assistance_level: AssistanceLevel.VERBAL_PROMPT,
          }) as unknown,
        }),
      );
    });

    it('should decrypt notes in the returned entry', async () => {
      const result = await service.create(
        createDto,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(mockDecrypt).toHaveBeenCalledWith('ENC(Some notes)');
      expect(result.notes).toBe('Some notes');
    });

    it('should throw NotFoundException when service record not found', async () => {
      serviceRecordDal.get.mockResolvedValue(null);

      await expect(
        service.create(
          createDto,
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for APPROVED service record', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockServiceRecord,
        status: ServiceRecordStatus.APPROVED,
      });

      await expect(
        service.create(
          createDto,
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when ADL category not found', async () => {
      adlCategoryDal.get.mockResolvedValue(null);

      await expect(
        service.create(
          createDto,
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit action on create', async () => {
      await service.create(
        createDto,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ADL_ENTRY_CREATED' }),
      );
    });

    it('should handle null notes without encrypting', async () => {
      const dtoNoNotes = { ...createDto, notes: undefined };

      await service.create(
        dtoNoNotes,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(adlEntryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            notes: null,
          }) as unknown,
        }),
      );
    });
  });

  describe('bulkCreate', () => {
    const bulkEntries = [
      {
        service_record_id: 'sr-uuid',
        individual_id: 'ind-uuid',
        adl_category_id: 'cat-uuid',
        assistance_level: AssistanceLevel.VERBAL_PROMPT,
        notes: 'Note 1',
      },
      {
        service_record_id: 'sr-uuid',
        individual_id: 'ind-uuid',
        adl_category_id: 'cat-uuid',
        assistance_level: AssistanceLevel.SUPERVISED,
        notes: 'Note 2',
      },
    ];

    it('should create all entries', async () => {
      const result = await service.bulkCreate(
        bulkEntries,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(result).toHaveLength(2);
      expect(adlEntryDal.create).toHaveBeenCalledTimes(2);
      expect(auditLogService.logAgencyAction).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException for empty array', async () => {
      await expect(
        service.bulkCreate(
          [],
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when entries have different service records', async () => {
      const mixedEntries = [
        { ...bulkEntries[0], service_record_id: 'sr-uuid' },
        { ...bulkEntries[1], service_record_id: 'other-sr-uuid' },
      ];

      await expect(
        service.bulkCreate(
          mixedEntries,
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for APPROVED service record', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockServiceRecord,
        status: ServiceRecordStatus.APPROVED,
      });

      await expect(
        service.bulkCreate(
          bulkEntries,
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when category not found in bulk', async () => {
      adlCategoryDal.get.mockResolvedValue(null);

      await expect(
        service.bulkCreate(
          bulkEntries,
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByServiceRecord', () => {
    it('should return decrypted entries', async () => {
      const result = await service.findByServiceRecord('sr-uuid', 'org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(mockDecrypt).toHaveBeenCalled();
    });

    it('should include pagination metadata', async () => {
      const result = await service.findByServiceRecord('sr-uuid', 'org-uuid');

      expect(result.paginationMeta).toEqual({ total: 1 });
    });
  });

  describe('findById', () => {
    it('should return decrypted entry and log PHI access', async () => {
      adlEntryDal.get.mockResolvedValue(mockEntry);

      const result = await service.findById(
        'entry-uuid',
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(result.id).toBe('entry-uuid');
      expect(mockDecrypt).toHaveBeenCalled();
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ADL_ENTRY_ACCESSED' }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      adlEntryDal.get.mockResolvedValue(null);

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
    it('should encrypt updated notes', async () => {
      adlEntryDal.get.mockResolvedValue(mockEntry);

      await service.update(
        'entry-uuid',
        { notes: 'Updated notes' },
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(mockEncrypt).toHaveBeenCalledWith('Updated notes');
      expect(adlEntryDal.update).toHaveBeenCalled();
    });

    it('should update assistance_level without encrypting', async () => {
      adlEntryDal.get.mockResolvedValue(mockEntry);

      await service.update(
        'entry-uuid',
        { assistance_level: AssistanceLevel.FULL_ASSIST },
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(adlEntryDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            assistance_level: AssistanceLevel.FULL_ASSIST,
          }) as unknown,
        }),
      );
    });

    it('should throw NotFoundException when entry not found', async () => {
      adlEntryDal.get.mockResolvedValue(null);

      await expect(
        service.update(
          'bad-id',
          { notes: 'test' },
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for APPROVED service record', async () => {
      adlEntryDal.get.mockResolvedValue(mockEntry);
      serviceRecordDal.get.mockResolvedValue({
        ...mockServiceRecord,
        status: ServiceRecordStatus.APPROVED,
      });

      await expect(
        service.update(
          'entry-uuid',
          { notes: 'test' },
          'org-uuid',
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log audit action on update', async () => {
      adlEntryDal.get.mockResolvedValue(mockEntry);

      await service.update(
        'entry-uuid',
        { notes: 'Updated' },
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ADL_ENTRY_UPDATED' }),
      );
    });
  });

  describe('findByIndividual', () => {
    it('should return paginated decrypted entries', async () => {
      const query = { individual_id: 'ind-uuid', page: 1, limit: 20 };

      const result = await service.findByIndividual(query, 'org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(result.paginationMeta).toBeDefined();
      expect(mockDecrypt).toHaveBeenCalled();
    });

    it('should pass pagination to DAL', async () => {
      const query = { individual_id: 'ind-uuid', page: 2, limit: 10 };

      await service.findByIndividual(query, 'org-uuid');

      expect(adlEntryDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { page: 2, limit: 10 },
        }),
      );
    });

    it('should filter by date range when both dates provided', async () => {
      const query = {
        individual_id: 'ind-uuid',
        date_from: '2026-03-01',
        date_to: '2026-03-31',
      };

      await service.findByIndividual(query, 'org-uuid');

      expect(adlEntryDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            recorded_at: expect.anything() as unknown,
          }) as unknown,
        }),
      );
    });

    it('should filter by category when provided', async () => {
      const query = {
        individual_id: 'ind-uuid',
        adl_category_id: 'cat-uuid',
      };

      await service.findByIndividual(query, 'org-uuid');

      expect(adlEntryDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            adl_category_id: 'cat-uuid',
          }) as unknown,
        }),
      );
    });
  });

  describe('getAdlSummary', () => {
    it('should return latest assistance level per category', async () => {
      const entries = [
        {
          ...mockEntry,
          adl_category_id: 'cat-1',
          assistance_level: AssistanceLevel.VERBAL_PROMPT,
          recorded_at: new Date('2026-03-15'),
        },
        {
          ...mockEntry,
          adl_category_id: 'cat-1',
          assistance_level: AssistanceLevel.SUPERVISED,
          recorded_at: new Date('2026-03-10'),
        },
        {
          ...mockEntry,
          adl_category_id: 'cat-2',
          assistance_level: AssistanceLevel.INDEPENDENT,
          recorded_at: new Date('2026-03-14'),
        },
      ];

      adlEntryDal.find.mockResolvedValue({
        payload: entries,
        paginationMeta: { total: 3 },
      });

      const result = await service.getAdlSummary('ind-uuid', 'org-uuid');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          adl_category_id: 'cat-1',
          assistance_level: AssistanceLevel.VERBAL_PROMPT,
        }),
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          adl_category_id: 'cat-2',
          assistance_level: AssistanceLevel.INDEPENDENT,
        }),
      );
    });

    it('should return empty array when no entries exist', async () => {
      adlEntryDal.find.mockResolvedValue({
        payload: [],
        paginationMeta: { total: 0 },
      });

      const result = await service.getAdlSummary('ind-uuid', 'org-uuid');

      expect(result).toEqual([]);
    });
  });
});
