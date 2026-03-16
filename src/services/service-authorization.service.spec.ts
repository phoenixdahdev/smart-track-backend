import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServiceAuthorizationService } from './service-authorization.service';
import { AuthorizationStatus } from '@enums/authorization-status.enum';

describe('ServiceAuthorizationService', () => {
  let service: ServiceAuthorizationService;
  let serviceAuthorizationDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let payerConfigDal: { get: jest.Mock };
  let serviceCodeDal: { get: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockRecord = {
    id: 'sa-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    payer_config_id: 'pc-uuid',
    service_code_id: 'sc-uuid',
    auth_number: 'AUTH-001',
    units_authorized: 100,
    units_used: 0,
    units_pending: 0,
    unit_type: '15MIN',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    rendering_provider_npi: null,
    status: AuthorizationStatus.ACTIVE,
    notes: null,
    created_by: 'user-uuid',
  };

  beforeEach(() => {
    serviceAuthorizationDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(mockRecord),
      create: jest.fn().mockResolvedValue(mockRecord),
      update: jest.fn().mockResolvedValue(mockRecord),
    };
    payerConfigDal = {
      get: jest.fn().mockResolvedValue({ id: 'pc-uuid' }),
    };
    serviceCodeDal = {
      get: jest.fn().mockResolvedValue({ id: 'sc-uuid' }),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new ServiceAuthorizationService(
      serviceAuthorizationDal as never,
      payerConfigDal as never,
      serviceCodeDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      individual_id: 'ind-uuid',
      payer_config_id: 'pc-uuid',
      service_code_id: 'sc-uuid',
      auth_number: 'AUTH-001',
      units_authorized: 100,
      unit_type: '15MIN',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
    };

    it('should create a service authorization', async () => {
      const result = await service.create(
        dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('sa-uuid');
      expect(serviceAuthorizationDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            individual_id: 'ind-uuid',
            auth_number: 'AUTH-001',
            units_authorized: 100,
            units_used: 0,
            units_pending: 0,
            status: AuthorizationStatus.ACTIVE,
            created_by: 'user-uuid',
          }) as unknown,
        }),
      );
    });

    it('should log audit action on create', async () => {
      await service.create(
        dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SERVICE_AUTH_CREATED',
          action_type: 'CREATE',
          table_name: 'service_authorizations',
          record_id: 'sa-uuid',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return record when found', async () => {
      const result = await service.findById('sa-uuid', 'org-uuid');
      expect(result.id).toBe('sa-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      serviceAuthorizationDal.get.mockResolvedValue(null);

      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated authorizations', async () => {
      const result = await service.list('org-uuid');
      expect(result.payload).toHaveLength(1);
    });

    it('should apply individual_id filter when provided', async () => {
      await service.list('org-uuid', undefined, { individual_id: 'ind-uuid' });

      expect(serviceAuthorizationDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            individual_id: 'ind-uuid',
          }) as unknown,
        }),
      );
    });

    it('should apply status filter when provided', async () => {
      await service.list('org-uuid', undefined, { status: AuthorizationStatus.ACTIVE });

      expect(serviceAuthorizationDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            status: AuthorizationStatus.ACTIVE,
          }) as unknown,
        }),
      );
    });
  });

  describe('listByIndividual', () => {
    it('should return authorizations for a specific individual', async () => {
      const result = await service.listByIndividual('ind-uuid', 'org-uuid');
      expect(result.payload).toHaveLength(1);
      expect(serviceAuthorizationDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            individual_id: 'ind-uuid',
            org_id: 'org-uuid',
          }) as unknown,
        }),
      );
    });
  });

  describe('update', () => {
    const dto = { units_authorized: 200 };

    it('should update an authorization', async () => {
      const result = await service.update(
        'sa-uuid', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(result.id).toBe('sa-uuid');
      expect(serviceAuthorizationDal.update).toHaveBeenCalled();
    });

    it('should reject update of voided authorization', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockRecord,
        status: AuthorizationStatus.VOIDED,
      });

      await expect(
        service.update('sa-uuid', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log audit action on update', async () => {
      await service.update(
        'sa-uuid', dto as never, 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SERVICE_AUTH_UPDATED',
          action_type: 'UPDATE',
          table_name: 'service_authorizations',
          record_id: 'sa-uuid',
        }),
      );
    });
  });

  describe('void', () => {
    it('should void an authorization', async () => {
      await service.void(
        'sa-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'No longer needed', '127.0.0.1', 'jest',
      );

      expect(serviceAuthorizationDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: AuthorizationStatus.VOIDED,
            notes: 'No longer needed',
          }) as unknown,
        }),
      );
    });

    it('should reject voiding an already voided authorization', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockRecord,
        status: AuthorizationStatus.VOIDED,
      });

      await expect(
        service.void('sa-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'reason', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log audit action on void', async () => {
      await service.void(
        'sa-uuid', 'org-uuid', 'user-uuid', 'BILLING_SPECIALIST', 'reason', '127.0.0.1', 'jest',
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SERVICE_AUTH_VOIDED',
          action_type: 'UPDATE',
          table_name: 'service_authorizations',
        }),
      );
    });
  });

  describe('incrementUnitsUsed', () => {
    it('should atomically increment units_used', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockRecord,
        units_used: 10,
      });

      await service.incrementUnitsUsed('sa-uuid', 'org-uuid', 4);

      expect(serviceAuthorizationDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            units_used: 14,
          }) as unknown,
        }),
      );
    });

    it('should throw NotFoundException when auth not found', async () => {
      serviceAuthorizationDal.get.mockResolvedValue(null);

      await expect(
        service.incrementUnitsUsed('bad-id', 'org-uuid', 4),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAuthForBilling', () => {
    it('should return matching auth for service date', async () => {
      serviceAuthorizationDal.find.mockResolvedValue({
        payload: [mockRecord],
      });

      const result = await service.findAuthForBilling(
        'ind-uuid', 'sc-uuid', '2026-06-15', 'org-uuid',
      );

      expect(result).toBeDefined();
      expect(result!.id).toBe('sa-uuid');
    });

    it('should return null when no matching auth found', async () => {
      serviceAuthorizationDal.find.mockResolvedValue({ payload: [] });

      const result = await service.findAuthForBilling(
        'ind-uuid', 'sc-uuid', '2099-01-01', 'org-uuid',
      );

      expect(result).toBeNull();
    });
  });

  describe('checkThresholds', () => {
    it('should return no alerts when usage is low', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockRecord,
        units_authorized: 100,
        units_used: 10,
        units_pending: 5,
        end_date: '2099-12-31',
      });

      const result = await service.checkThresholds('sa-uuid', 'org-uuid');

      expect(result.alerts).toHaveLength(0);
    });

    it('should return NEAR_LIMIT_80 when usage is at 80%', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockRecord,
        units_authorized: 100,
        units_used: 75,
        units_pending: 5,
        end_date: '2099-12-31',
      });

      const result = await service.checkThresholds('sa-uuid', 'org-uuid');

      expect(result.alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'NEAR_LIMIT_80' }),
        ]),
      );
    });

    it('should return NEAR_LIMIT_95 when usage is at 95%', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockRecord,
        units_authorized: 100,
        units_used: 90,
        units_pending: 6,
        end_date: '2099-12-31',
      });

      const result = await service.checkThresholds('sa-uuid', 'org-uuid');

      expect(result.alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'NEAR_LIMIT_95' }),
        ]),
      );
    });

    it('should return EXCEEDED when usage exceeds authorized', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockRecord,
        units_authorized: 100,
        units_used: 95,
        units_pending: 10,
        end_date: '2099-12-31',
      });

      const result = await service.checkThresholds('sa-uuid', 'org-uuid');

      expect(result.alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'EXCEEDED' }),
        ]),
      );
    });

    it('should return EXPIRING_SOON when end_date is within 30 days', async () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 15);
      const soonStr = soon.toISOString().split('T')[0];

      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockRecord,
        units_authorized: 100,
        units_used: 10,
        units_pending: 0,
        end_date: soonStr,
      });

      const result = await service.checkThresholds('sa-uuid', 'org-uuid');

      expect(result.alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'EXPIRING_SOON' }),
        ]),
      );
    });

    it('should return EXPIRED when end_date has passed', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockRecord,
        units_authorized: 100,
        units_used: 10,
        units_pending: 0,
        end_date: '2020-01-01',
      });

      const result = await service.checkThresholds('sa-uuid', 'org-uuid');

      expect(result.alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'EXPIRED' }),
        ]),
      );
    });
  });
});
