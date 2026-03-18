import { BadRequestException } from '@nestjs/common';
import { AdminClaimsAnalyticsController } from './admin-claims-analytics.controller';

describe('AdminClaimsAnalyticsController', () => {
  let controller: AdminClaimsAnalyticsController;
  let claimsAnalyticsService: {
    getClaimsLifecycle: jest.Mock;
    getDenialAnalysis: jest.Mock;
  };
  let csvExportService: { toCsv: jest.Mock };

  const mockCurrentUser = {
    id: 'admin-uuid',
    org_id: 'org-uuid',
    role: 'ADMIN',
    email: 'admin@test.com',
    name: 'Admin User',
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
    denial_analysis: [],
  };

  beforeEach(() => {
    claimsAnalyticsService = {
      getClaimsLifecycle: jest.fn().mockResolvedValue(mockReport),
      getDenialAnalysis: jest.fn().mockResolvedValue([]),
    };
    csvExportService = { toCsv: jest.fn().mockReturnValue('csv-data') };

    controller = new AdminClaimsAnalyticsController(
      claimsAnalyticsService as never,
      csvExportService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/reports/claims-lifecycle', () => {
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
  });

  describe('GET /admin/reports/claims-lifecycle/denial-analysis', () => {
    it('should return denial analysis', async () => {
      const result = await controller.denialAnalysis(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('Denial analysis generated');
    });
  });

  describe('GET /admin/reports/claims-lifecycle/export', () => {
    it('should send CSV response', async () => {
      const res = { setHeader: jest.fn(), send: jest.fn() };

      await controller.exportCsv(mockCurrentUser as never, {} as never, res as never);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.send).toHaveBeenCalled();
    });
  });
});
