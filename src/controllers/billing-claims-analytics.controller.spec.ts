import { BadRequestException } from '@nestjs/common';
import { BillingClaimsAnalyticsController } from './billing-claims-analytics.controller';

describe('BillingClaimsAnalyticsController', () => {
  let controller: BillingClaimsAnalyticsController;
  let claimsAnalyticsService: {
    getClaimsLifecycle: jest.Mock;
    getDenialAnalysis: jest.Mock;
  };
  let csvExportService: { toCsv: jest.Mock };

  const mockCurrentUser = {
    id: 'billing-uuid',
    org_id: 'org-uuid',
    role: 'BILLING_SPECIALIST',
    email: 'billing@test.com',
    name: 'Billing User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  const mockReport = {
    by_status: [{ status: 'SUBMITTED', count: 5, total_charge_cents: 50000 }],
    total_claims: 5,
    avg_days_draft_to_submitted: 3,
    avg_days_submitted_to_paid: 15,
    avg_days_submitted_to_denied: 10,
    denial_analysis: [{ reason_code: 'CO-4', count: 2, total_charge_cents: 20000, percentage: 100 }],
  };

  beforeEach(() => {
    claimsAnalyticsService = {
      getClaimsLifecycle: jest.fn().mockResolvedValue(mockReport),
      getDenialAnalysis: jest.fn().mockResolvedValue(mockReport.denial_analysis),
    };
    csvExportService = { toCsv: jest.fn().mockReturnValue('csv-data') };

    controller = new BillingClaimsAnalyticsController(
      claimsAnalyticsService as never,
      csvExportService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /billing/reports/claims-lifecycle', () => {
    it('should return claims lifecycle report', async () => {
      const result = await controller.claimsLifecycle(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('Claims lifecycle report generated');
      expect(result.data.total_claims).toBe(5);
    });

    it('should throw BadRequestException when user has no org_id', async () => {
      const noOrgUser = { ...mockCurrentUser, org_id: null };

      await expect(
        controller.claimsLifecycle(noOrgUser as never, {} as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('should pass filters to service', async () => {
      const query = { date_from: '2026-01-01', payer_config_id: 'pc-uuid' };

      await controller.claimsLifecycle(mockCurrentUser as never, query as never);

      expect(claimsAnalyticsService.getClaimsLifecycle).toHaveBeenCalledWith(
        'org-uuid',
        expect.objectContaining({ date_from: '2026-01-01', payer_config_id: 'pc-uuid' }),
      );
    });
  });

  describe('GET /billing/reports/claims-lifecycle/denial-analysis', () => {
    it('should return denial analysis', async () => {
      const result = await controller.denialAnalysis(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('Denial analysis generated');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /billing/reports/claims-lifecycle/export', () => {
    it('should send CSV response', async () => {
      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await controller.exportCsv(mockCurrentUser as never, {} as never, res as never);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.send).toHaveBeenCalled();
    });
  });
});
