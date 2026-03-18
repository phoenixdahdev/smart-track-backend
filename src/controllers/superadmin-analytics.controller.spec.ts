import { SuperadminAnalyticsController } from './superadmin-analytics.controller';

describe('SuperadminAnalyticsController', () => {
  let controller: SuperadminAnalyticsController;
  let platformAnalyticsService: {
    getPlatformAnalytics: jest.Mock;
    getAgencyHealthScores: jest.Mock;
  };
  let csvExportService: { toCsv: jest.Mock };

  const mockAnalytics = {
    total_agencies: 10,
    active_agencies: 8,
    total_mrr_cents: 299000,
    mrr_by_tier: [{ tier: 'professional', count: 5, mrr_cents: 149500 }],
    agencies_by_status: { ACTIVE: 8, SUSPENDED: 2 },
    claims_by_status_platform: { SUBMITTED: 50, PAID: 30 },
    avg_claims_per_agency: 10,
    agency_health_scores: [
      {
        org_id: 'org-1',
        legal_name: 'Test Agency',
        plan_tier: 'professional',
        active_users: 5,
        claims_submitted_30d: 10,
        claim_success_rate_percent: 85,
        health_score: 'HEALTHY',
      },
    ],
  };

  beforeEach(() => {
    platformAnalyticsService = {
      getPlatformAnalytics: jest.fn().mockResolvedValue(mockAnalytics),
      getAgencyHealthScores: jest.fn().mockResolvedValue(mockAnalytics.agency_health_scores),
    };
    csvExportService = { toCsv: jest.fn().mockReturnValue('csv-data') };

    controller = new SuperadminAnalyticsController(
      platformAnalyticsService as never,
      csvExportService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /superadmin/platform/analytics', () => {
    it('should return platform analytics', async () => {
      const result = await controller.platformAnalytics();

      expect(result.message).toBe('Platform analytics generated');
      expect(result.data.total_agencies).toBe(10);
      expect(result.data.active_agencies).toBe(8);
    });
  });

  describe('GET /superadmin/platform/analytics/agency-health', () => {
    it('should return agency health scores', async () => {
      const result = await controller.agencyHealth();

      expect(result.message).toBe('Agency health scores generated');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /superadmin/platform/analytics/export', () => {
    it('should send CSV response', async () => {
      const res = { setHeader: jest.fn(), send: jest.fn() };

      await controller.exportCsv(res as never);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.send).toHaveBeenCalled();
    });

    it('should include platform summary in CSV', async () => {
      const res = { setHeader: jest.fn(), send: jest.fn() };

      await controller.exportCsv(res as never);

       
      const csvContent = (res.send.mock.calls as string[][])[0][0];
      expect(csvContent).toContain('Platform Summary');
      expect(csvContent).toContain('Total Agencies,10');
    });
  });
});
