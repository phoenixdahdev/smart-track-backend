import { NotFoundException } from '@nestjs/common';
import { MarEntryService } from './mar-entry.service';
import { MarResult } from '@enums/mar-result.enum';

const mockEncrypt = jest.fn((v: string) => `ENC(${v})`);
const mockDecrypt = jest.fn((v: string) => v.replace(/^ENC\((.+)\)$/, '$1'));

describe('MarEntryService', () => {
  let service: MarEntryService;
  let marEntryDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
  };
  let encryptionService: { encrypt: jest.Mock; decrypt: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockEntry = {
    id: 'mar-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    administered_by: 'staff-uuid',
    drug_name: 'ENC(Risperidone)',
    dose: 'ENC(0.5mg)',
    route: 'ENC(oral)',
    scheduled_time: new Date(),
    administered_time: new Date(),
    result: MarResult.GIVEN,
    notes: null,
  };

  beforeEach(() => {
    marEntryDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockEntry],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockEntry),
    };
    encryptionService = { encrypt: mockEncrypt, decrypt: mockDecrypt };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new MarEntryService(
      marEntryDal as never,
      encryptionService as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should encrypt PHI fields and create MAR entry', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        drug_name: 'Risperidone',
        dose: '0.5mg',
        route: 'oral',
        scheduled_time: '2026-03-10T08:00:00.000Z',
        result: MarResult.GIVEN,
      };

      await service.create(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(mockEncrypt).toHaveBeenCalledWith('Risperidone');
      expect(mockEncrypt).toHaveBeenCalledWith('0.5mg');
      expect(mockEncrypt).toHaveBeenCalledWith('oral');
      expect(marEntryDal.create).toHaveBeenCalled();
    });

    it('should log audit action', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        drug_name: 'Med',
        dose: '1mg',
        scheduled_time: '2026-03-10T08:00:00.000Z',
        result: MarResult.GIVEN,
      };

      await service.create(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MAR_ENTRY_CREATED' }),
      );
    });
  });

  describe('findById', () => {
    it('should decrypt and return entry when found', async () => {
      marEntryDal.get.mockResolvedValue(mockEntry);

      const result = await service.findById(
        'mar-uuid',
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(result.id).toBe('mar-uuid');
      expect(mockDecrypt).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(
        service.findById('bad-id', 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listByIndividual', () => {
    it('should return decrypted entries', async () => {
      const result = await service.listByIndividual('ind-uuid', 'org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(mockDecrypt).toHaveBeenCalled();
    });
  });
});
