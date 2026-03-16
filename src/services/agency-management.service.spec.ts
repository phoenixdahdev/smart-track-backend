import { NotFoundException } from '@nestjs/common';
import { AgencyManagementService } from './agency-management.service';
import { OrgStatus } from '@enums/org-status.enum';

describe('AgencyManagementService', () => {
  let service: AgencyManagementService;
  let organizationDal: { get: jest.Mock; find: jest.Mock; update: jest.Mock };
  let subscriptionDal: { get: jest.Mock };
  let contactDal: { find: jest.Mock };
  let agreementDal: { find: jest.Mock };
  let moduleDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let featureFlagDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let auditLogService: { logPlatformAction: jest.Mock };

  const mockOrg = {
    id: 'org-uuid',
    legal_name: 'Test Agency',
    npi: '1234567890',
    status: OrgStatus.ACTIVE,
    plan_tier: 'STARTER',
  };

  const mockModule = {
    id: 'mod-uuid',
    org_id: 'org-uuid',
    module_name: 'billing',
    enabled: true,
  };

  const mockFlag = {
    id: 'flag-uuid',
    org_id: 'org-uuid',
    flag_name: 'beta_feature',
    value: true,
  };

  beforeEach(() => {
    organizationDal = {
      get: jest.fn().mockResolvedValue(mockOrg),
      find: jest.fn().mockResolvedValue({ payload: [mockOrg], paginationMeta: { total: 1 } }),
      update: jest.fn().mockResolvedValue(mockOrg),
    };
    subscriptionDal = { get: jest.fn().mockResolvedValue({ id: 'sub-uuid' }) };
    contactDal = { find: jest.fn().mockResolvedValue({ payload: [], paginationMeta: { total: 0 } }) };
    agreementDal = { find: jest.fn().mockResolvedValue({ payload: [], paginationMeta: { total: 0 } }) };
    moduleDal = {
      get: jest.fn().mockResolvedValue(mockModule),
      find: jest.fn().mockResolvedValue({ payload: [mockModule], paginationMeta: { total: 1 } }),
      create: jest.fn().mockResolvedValue(mockModule),
      update: jest.fn().mockResolvedValue(mockModule),
    };
    featureFlagDal = {
      get: jest.fn().mockResolvedValue(mockFlag),
      find: jest.fn().mockResolvedValue({ payload: [mockFlag], paginationMeta: { total: 1 } }),
      create: jest.fn().mockResolvedValue(mockFlag),
      update: jest.fn().mockResolvedValue(mockFlag),
    };
    auditLogService = { logPlatformAction: jest.fn().mockResolvedValue(undefined) };

    service = new AgencyManagementService(
      organizationDal as never,
      subscriptionDal as never,
      contactDal as never,
      agreementDal as never,
      moduleDal as never,
      featureFlagDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listOrganizations', () => {
    it('should return paginated organizations', async () => {
      const result = await service.listOrganizations();
      expect(result.payload).toHaveLength(1);
    });

    it('should apply status filter', async () => {
      await service.listOrganizations(undefined, { status: OrgStatus.ACTIVE });

      expect(organizationDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ status: OrgStatus.ACTIVE }) as unknown,
        }),
      );
    });
  });

  describe('getOrganization', () => {
    it('should return an org when found', async () => {
      const result = await service.getOrganization('org-uuid');
      expect(result.id).toBe('org-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      organizationDal.get.mockResolvedValue(null);
      await expect(service.getOrganization('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOrgStatus', () => {
    it('should update org status and audit log', async () => {
      await service.updateOrgStatus('org-uuid', OrgStatus.SUSPENDED, 'Compliance issue', 'op-uuid', '127.0.0.1', 'jest');

      expect(organizationDal.update).toHaveBeenCalled();
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ORG_SUSPENDED' }),
      );
    });
  });

  describe('getContacts', () => {
    it('should return contacts for an org', async () => {
      const result = await service.getContacts('org-uuid');
      expect(result.payload).toBeDefined();
    });
  });

  describe('getAgreements', () => {
    it('should return agreements for an org', async () => {
      const result = await service.getAgreements('org-uuid');
      expect(result.payload).toBeDefined();
    });
  });

  describe('toggleModule', () => {
    it('should update existing module', async () => {
      await service.toggleModule('org-uuid', 'billing', false, 'op-uuid', '127.0.0.1', 'jest');

      expect(moduleDal.update).toHaveBeenCalled();
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MODULE_DISABLED' }),
      );
    });

    it('should create new module when not existing', async () => {
      moduleDal.get.mockResolvedValue(null);

      await service.toggleModule('org-uuid', 'new_module', true, 'op-uuid', '127.0.0.1', 'jest');

      expect(moduleDal.create).toHaveBeenCalled();
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MODULE_ENABLED' }),
      );
    });
  });

  describe('setFeatureFlag', () => {
    it('should update existing feature flag', async () => {
      await service.setFeatureFlag('org-uuid', 'beta_feature', false, 'op-uuid', 'Disabled beta');

      expect(featureFlagDal.update).toHaveBeenCalled();
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'FEATURE_FLAG_SET' }),
      );
    });

    it('should create new feature flag when not existing', async () => {
      featureFlagDal.get.mockResolvedValue(null);

      await service.setFeatureFlag('org-uuid', 'new_flag', true, 'op-uuid');

      expect(featureFlagDal.create).toHaveBeenCalled();
    });
  });

  describe('getModules', () => {
    it('should return modules for an org', async () => {
      const result = await service.getModules('org-uuid');
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('getFeatureFlags', () => {
    it('should return feature flags for an org', async () => {
      const result = await service.getFeatureFlags('org-uuid');
      expect(result.payload).toHaveLength(1);
    });
  });
});
