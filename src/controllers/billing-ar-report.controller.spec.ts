import { BadRequestException } from '@nestjs/common';
import { BillingArReportController } from './billing-ar-report.controller';

describe('BillingArReportController', () => {
  let controller: BillingArReportController;
  let arReportService: {
    getArAgingReport: jest.Mock;
    getEftReconciliation: jest.Mock;
    getFinancialDashboard: jest.Mock;
    getPayerPerformance: jest.Mock;
  };

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

  beforeEach(() => {
    arReportService = {
      getArAgingReport: jest.fn().mockResolvedValue({
        buckets: [
          { bucket: '0-30', count: 5, total_cents: 50000 },
          { bucket: '31-60', count: 2, total_cents: 20000 },
          { bucket: '61-90', count: 0, total_cents: 0 },
          { bucket: '91-120', count: 0, total_cents: 0 },
          { bucket: '120+', count: 1, total_cents: 10000 },
        ],
        total_outstanding_cents: 80000,
        total_claims: 8,
      }),
      getEftReconciliation: jest.fn().mockResolvedValue({
        rows: [],
        total_eft_cents: 0,
        total_posted_cents: 0,
        total_variance_cents: 0,
      }),
      getFinancialDashboard: jest.fn().mockResolvedValue({
        total_billed_cents: 100000,
        total_paid_cents: 80000,
        total_adjustments_cents: 5000,
        total_outstanding_cents: 15000,
        collection_rate_percent: 80,
        avg_days_to_payment: 21,
      }),
      getPayerPerformance: jest.fn().mockResolvedValue({
        payers: [],
      }),
    };

    controller = new BillingArReportController(arReportService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /billing/reports/ar-aging', () => {
    it('should return AR aging report', async () => {
      const result = await controller.arAging(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('AR aging report generated');
      expect(result.data.buckets).toHaveLength(5);
      expect(result.data.total_claims).toBe(8);
    });

    it('should throw BadRequestException when user has no org_id', async () => {
      const noOrgUser = { ...mockCurrentUser, org_id: null };

      await expect(
        controller.arAging(noOrgUser as never, {} as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('should pass filters to service', async () => {
      const query = { payer_config_id: 'pc-uuid', individual_id: 'ind-uuid', as_of_date: '2026-03-15' };

      await controller.arAging(mockCurrentUser as never, query as never);

      expect(arReportService.getArAgingReport).toHaveBeenCalledWith(
        'org-uuid',
        { payer_config_id: 'pc-uuid', individual_id: 'ind-uuid', as_of_date: '2026-03-15' },
      );
    });
  });

  describe('GET /billing/reports/eft-reconciliation', () => {
    it('should return EFT reconciliation report', async () => {
      const result = await controller.eftReconciliation(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('EFT reconciliation report generated');
    });
  });

  describe('GET /billing/reports/financial-dashboard', () => {
    it('should return financial dashboard', async () => {
      const result = await controller.financialDashboard(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('Financial dashboard generated');
      expect(result.data.collection_rate_percent).toBe(80);
    });
  });

  describe('GET /billing/reports/payer-performance', () => {
    it('should return payer performance data', async () => {
      const result = await controller.payerPerformance(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('Payer performance report generated');
    });
  });
});
