import { NotFoundException } from '@nestjs/common';
import { IndividualService } from './individual.service';

const mockEncrypt = jest.fn((v: string) => `ENC(${v})`);
const mockDecrypt = jest.fn((v: string) => v.replace(/^ENC\((.+)\)$/, '$1'));

describe('IndividualService', () => {
  let service: IndividualService;
  let individualDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let encryptionService: { encrypt: jest.Mock; decrypt: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockIndividual = {
    id: 'ind-uuid',
    org_id: 'org-uuid',
    first_name: 'John',
    last_name: 'Doe',
    ssn: 'ENC(123-45-6789)',
    date_of_birth: 'ENC(1990-05-15)',
    medicaid_id: null,
    diagnosis_codes: null,
    address: null,
    phone: null,
    emergency_contact: null,
    guardian_id: null,
    active: true,
  };

  beforeEach(() => {
    individualDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockIndividual],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockIndividual),
      update: jest.fn().mockResolvedValue(mockIndividual),
    };
    encryptionService = {
      encrypt: mockEncrypt,
      decrypt: mockDecrypt,
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new IndividualService(
      individualDal as never,
      encryptionService as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    it('should return decrypted individuals for org', async () => {
      const result = await service.list('org-uuid');
      expect(individualDal.find).toHaveBeenCalledWith(
        expect.objectContaining({ findOptions: { org_id: 'org-uuid' } }),
      );
      expect(result.payload).toHaveLength(1);
      // PHI fields should be decrypted
      expect(mockDecrypt).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should encrypt PHI fields before saving', async () => {
      const dto = {
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-05-15',
        ssn: '123-45-6789',
      };

      await service.create(dto, 'org-uuid', 'admin-uuid', '127.0.0.1', 'jest');

      expect(mockEncrypt).toHaveBeenCalledWith('123-45-6789');
      expect(mockEncrypt).toHaveBeenCalledWith('1990-05-15');
      expect(individualDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            ssn: 'ENC(123-45-6789)',
            date_of_birth: 'ENC(1990-05-15)',
          }),
        }),
      );
    });

    it('should log audit action on create', async () => {
      await service.create(
        { first_name: 'A', last_name: 'B', date_of_birth: '2000-01-01' },
        'org-uuid',
        'admin-uuid',
        '127.0.0.1',
        'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'INDIVIDUAL_CREATED' }),
      );
    });
  });

  describe('findById', () => {
    it('should return decrypted individual when found', async () => {
      individualDal.get.mockResolvedValue(mockIndividual);

      const result = await service.findById(
        'ind-uuid',
        'org-uuid',
        'admin-uuid',
        'ADMIN',
        '127.0.0.1',
        'jest',
      );

      expect(result.id).toBe('ind-uuid');
      expect(mockDecrypt).toHaveBeenCalled();
    });

    it('should log PHI access audit', async () => {
      individualDal.get.mockResolvedValue(mockIndividual);

      await service.findById(
        'ind-uuid',
        'org-uuid',
        'admin-uuid',
        'ADMIN',
        '127.0.0.1',
        'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'INDIVIDUAL_ACCESSED' }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      individualDal.get.mockResolvedValue(null);

      await expect(
        service.findById(
          'bad-id',
          'org-uuid',
          'admin-uuid',
          'ADMIN',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should encrypt updated PHI fields', async () => {
      individualDal.get.mockResolvedValue(mockIndividual);

      await service.update(
        'ind-uuid',
        'org-uuid',
        { ssn: '999-88-7777' },
        'admin-uuid',
        '127.0.0.1',
        'jest',
      );

      expect(mockEncrypt).toHaveBeenCalledWith('999-88-7777');
      expect(individualDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            ssn: 'ENC(999-88-7777)',
          }),
        }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      individualDal.get.mockResolvedValue(null);

      await expect(
        service.update(
          'bad-id',
          'org-uuid',
          { first_name: 'X' },
          'admin-uuid',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
