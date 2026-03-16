import { BadRequestException } from '@nestjs/common';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { ApplicationStatus } from '@enums/application-status.enum';

describe('TenantProvisioningService', () => {
  let service: TenantProvisioningService;
  let organizationDal: { create: jest.Mock };
  let userDal: { create: jest.Mock };
  let subscriptionDal: { create: jest.Mock };
  let checklistDal: { create: jest.Mock };
  let orgModuleDal: { create: jest.Mock };
  let applicationDal: { get: jest.Mock; update: jest.Mock };
  let auditLogService: { logPlatformAction: jest.Mock };

  const mockApplication = {
    id: 'app-uuid',
    org_name: 'Test Agency',
    npi: '1234567890',
    ein: '123456789',
    contact_name: 'John Doe',
    contact_email: 'john@testagency.com',
    plan_tier: 'STARTER',
    status: ApplicationStatus.APPROVED,
  };

  beforeEach(() => {
    organizationDal = { create: jest.fn().mockResolvedValue({ id: 'org-uuid' }) };
    userDal = { create: jest.fn().mockResolvedValue({ id: 'user-uuid' }) };
    subscriptionDal = { create: jest.fn().mockResolvedValue({ id: 'sub-uuid' }) };
    checklistDal = { create: jest.fn().mockResolvedValue({ id: 'checklist-uuid' }) };
    orgModuleDal = { create: jest.fn().mockResolvedValue({ id: 'mod-uuid' }) };
    applicationDal = {
      get: jest.fn().mockResolvedValue(mockApplication),
      update: jest.fn().mockResolvedValue(mockApplication),
    };
    auditLogService = { logPlatformAction: jest.fn().mockResolvedValue(undefined) };

    service = new TenantProvisioningService(
      organizationDal as never,
      userDal as never,
      subscriptionDal as never,
      checklistDal as never,
      orgModuleDal as never,
      applicationDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('provision', () => {
    it('should provision a tenant from approved application', async () => {
      const result = await service.provision('app-uuid', 'op-uuid', '127.0.0.1', 'jest');

      expect(result.application_id).toBe('app-uuid');
      expect(result.org_id).toBe('org-uuid');
      expect(result.admin_user_id).toBe('user-uuid');
      expect(result.subscription_id).toBe('sub-uuid');
      expect(result.checklist_id).toBe('checklist-uuid');
      expect(result.modules_enabled.length).toBeGreaterThan(0);
    });

    it('should create organization with application data', async () => {
      await service.provision('app-uuid', 'op-uuid', '127.0.0.1', 'jest');

      expect(organizationDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            legal_name: 'Test Agency',
            npi: '1234567890',
            ein: '123456789',
          }) as unknown,
        }),
      );
    });

    it('should create admin user with application email', async () => {
      await service.provision('app-uuid', 'op-uuid', '127.0.0.1', 'jest');

      expect(userDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            email: 'john@testagency.com',
            name: 'John Doe',
            role: 'ADMIN',
          }) as unknown,
        }),
      );
    });

    it('should enable default modules', async () => {
      await service.provision('app-uuid', 'op-uuid', '127.0.0.1', 'jest');

      expect(orgModuleDal.create).toHaveBeenCalledTimes(5);
    });

    it('should transition application through PROVISIONING to ONBOARDING', async () => {
      await service.provision('app-uuid', 'op-uuid', '127.0.0.1', 'jest');

      expect(applicationDal.update).toHaveBeenCalledTimes(2);
    });

    it('should audit log the provisioning', async () => {
      await service.provision('app-uuid', 'op-uuid', '127.0.0.1', 'jest');

      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TENANT_PROVISIONED' }),
      );
    });

    it('should throw BadRequestException when application not found', async () => {
      applicationDal.get.mockResolvedValue(null);

      await expect(
        service.provision('bad-id', 'op-uuid', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when application is not APPROVED', async () => {
      applicationDal.get.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.SUBMITTED,
      });

      await expect(
        service.provision('app-uuid', 'op-uuid', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
