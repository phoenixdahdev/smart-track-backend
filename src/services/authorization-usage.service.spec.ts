import { AuthorizationUsageService } from './authorization-usage.service';
import { AuthorizationStatus } from '@enums/authorization-status.enum';

describe('AuthorizationUsageService', () => {
  let service: AuthorizationUsageService;
  let serviceAuthorizationDal: { find: jest.Mock };

  const futureDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const mockAuth = (overrides: Record<string, unknown> = {}) => ({
    id: 'auth-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    payer_config_id: 'pc-uuid',
    service_code_id: 'sc-uuid',
    auth_number: 'AUTH-001',
    units_authorized: 100,
    units_used: 50,
    units_pending: 10,
    status: AuthorizationStatus.ACTIVE,
    start_date: '2026-01-01',
    end_date: futureDate(60),
    ...overrides,
  });

  beforeEach(() => {
    serviceAuthorizationDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockAuth()] }),
    };

    service = new AuthorizationUsageService(serviceAuthorizationDal as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthorizationUsage', () => {
    it('should return authorization usage rows', async () => {
      const result = await service.getAuthorizationUsage('org-uuid');

      expect(result.authorizations).toHaveLength(1);
      expect(result.authorizations[0].auth_number).toBe('AUTH-001');
    });

    it('should calculate utilization percent', async () => {
      const result = await service.getAuthorizationUsage('org-uuid');

      expect(result.authorizations[0].utilization_percent).toBe(60);
      expect(result.authorizations[0].units_remaining).toBe(40);
    });

    it('should flag approaching threshold (>=80%)', async () => {
      serviceAuthorizationDal.find.mockResolvedValue({
        payload: [mockAuth({ units_used: 85, units_pending: 0 })],
      });

      const result = await service.getAuthorizationUsage('org-uuid');

      expect(result.approaching_threshold).toBe(1);
    });

    it('should flag exceeded (>=100%)', async () => {
      serviceAuthorizationDal.find.mockResolvedValue({
        payload: [mockAuth({ units_used: 100, units_pending: 5 })],
      });

      const result = await service.getAuthorizationUsage('org-uuid');

      expect(result.exceeded).toBe(1);
      expect(result.authorizations[0].units_remaining).toBe(0);
    });

    it('should flag expiring soon (<=30 days)', async () => {
      serviceAuthorizationDal.find.mockResolvedValue({
        payload: [mockAuth({ end_date: futureDate(15) })],
      });

      const result = await service.getAuthorizationUsage('org-uuid');

      expect(result.expiring_soon).toBe(1);
    });

    it('should skip non-ACTIVE authorizations', async () => {
      serviceAuthorizationDal.find.mockResolvedValue({
        payload: [
          mockAuth({ status: AuthorizationStatus.EXPIRED }),
          mockAuth({ id: 'a2', status: AuthorizationStatus.VOIDED }),
        ],
      });

      const result = await service.getAuthorizationUsage('org-uuid');

      expect(result.authorizations).toHaveLength(0);
    });

    it('should filter alerts_only', async () => {
      serviceAuthorizationDal.find.mockResolvedValue({
        payload: [
          mockAuth({ id: 'a1', units_used: 50, units_pending: 0, end_date: futureDate(60) }),
          mockAuth({ id: 'a2', units_used: 90, units_pending: 0 }),
        ],
      });

      const result = await service.getAuthorizationUsage('org-uuid', { alerts_only: true });

      expect(result.authorizations).toHaveLength(1);
      expect(result.authorizations[0].authorization_id).toBe('a2');
    });

    it('should apply individual_id filter', async () => {
      await service.getAuthorizationUsage('org-uuid', { individual_id: 'ind-uuid' });

      expect(serviceAuthorizationDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ individual_id: 'ind-uuid' }) as unknown,
        }),
      );
    });

    it('should apply payer_config_id filter', async () => {
      await service.getAuthorizationUsage('org-uuid', { payer_config_id: 'pc-uuid' });

      expect(serviceAuthorizationDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ payer_config_id: 'pc-uuid' }) as unknown,
        }),
      );
    });

    it('should return zeros for empty data', async () => {
      serviceAuthorizationDal.find.mockResolvedValue({ payload: [] });

      const result = await service.getAuthorizationUsage('org-uuid');

      expect(result.authorizations).toHaveLength(0);
      expect(result.approaching_threshold).toBe(0);
      expect(result.exceeded).toBe(0);
      expect(result.expiring_soon).toBe(0);
    });
  });
});
