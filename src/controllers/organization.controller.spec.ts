import { OrganizationController } from './organization.controller';
import { OrganizationService } from '@services/organization.service';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let orgService: {
    create: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };

  const mockOrg = {
    id: 'org-uuid',
    legal_name: 'Sunrise Care LLC',
    npi: '1234567890',
    ein: '12-3456789',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    orgService = {
      create: jest.fn().mockResolvedValue(mockOrg),
      findById: jest.fn().mockResolvedValue(mockOrg),
      update: jest.fn().mockResolvedValue(mockOrg),
    };

    controller = new OrganizationController(
      orgService as unknown as OrganizationService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /organizations', () => {
    it('should create org and return it', async () => {
      const result = await controller.create(
        {
          legal_name: 'Sunrise Care LLC',
          npi: '1234567890',
          ein: '12-3456789',
        },
        'user-uuid',
      );

      expect(result.message).toBe('Organization created successfully');
      expect(result.data.id).toBe('org-uuid');
    });
  });

  describe('GET /organizations/:id', () => {
    it('should return org by id', async () => {
      const result = await controller.findById('org-uuid');

      expect(result.message).toBe('Organization retrieved');
      expect(result.data.legal_name).toBe('Sunrise Care LLC');
    });
  });

  describe('PATCH /organizations/:id', () => {
    it('should update and return org', async () => {
      const result = await controller.update('org-uuid', {
        legal_name: 'New Name',
      });

      expect(result.message).toBe('Organization updated');
    });
  });
});
