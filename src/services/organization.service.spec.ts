import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrgStatus } from '@enums/org-status.enum';
import { AgencyRole } from '@enums/role.enum';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let organizationDal: { get: jest.Mock; create: jest.Mock; update: jest.Mock };
  let userDal: { update: jest.Mock };

  const mockOrg = {
    id: 'org-uuid',
    legal_name: 'Sunrise Care LLC',
    npi: '1234567890',
    ein: '12-3456789',
    status: OrgStatus.ACTIVE,
  };

  beforeEach(() => {
    organizationDal = {
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockOrg),
      update: jest.fn().mockResolvedValue(mockOrg),
    };
    userDal = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    service = new OrganizationService(
      organizationDal as never,
      userDal as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create org and update user', async () => {
      const result = await service.create(
        {
          legal_name: 'Sunrise Care LLC',
          npi: '1234567890',
          ein: '12-3456789',
        },
        'user-uuid',
      );

      expect(result.id).toBe('org-uuid');
      expect(organizationDal.create).toHaveBeenCalled();
      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: 'user-uuid' },
          updatePayload: { org_id: 'org-uuid', role: AgencyRole.AGENCY_OWNER },
        }),
      );
    });

    it('should throw when NPI already exists', async () => {
      organizationDal.get.mockResolvedValue(mockOrg);

      await expect(
        service.create(
          { legal_name: 'Dupe', npi: '1234567890', ein: '12-3456789' },
          'user-uuid',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return org when found', async () => {
      organizationDal.get.mockResolvedValue(mockOrg);

      const result = await service.findById('org-uuid');
      expect(result.legal_name).toBe('Sunrise Care LLC');
    });

    it('should throw NotFoundException when not found', async () => {
      organizationDal.get.mockResolvedValue(null);

      await expect(service.findById('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update org', async () => {
      organizationDal.get.mockResolvedValue(mockOrg);

      await service.update('org-uuid', { legal_name: 'New Name' });

      expect(organizationDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: 'org-uuid' },
          updatePayload: { legal_name: 'New Name' },
        }),
      );
    });

    it('should throw NotFoundException when org not found', async () => {
      organizationDal.get.mockResolvedValue(null);

      await expect(
        service.update('bad-id', { legal_name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
