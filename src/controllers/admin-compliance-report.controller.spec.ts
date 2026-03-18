import { BadRequestException } from '@nestjs/common';
import { AdminComplianceReportController } from './admin-compliance-report.controller';

describe('AdminComplianceReportController', () => {
  let controller: AdminComplianceReportController;
  let complianceService: { getComplianceReport: jest.Mock };
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

  beforeEach(() => {
    complianceService = {
      getComplianceReport: jest.fn().mockResolvedValue({
        total_records: 10,
        by_status: [],
        approval_rate_percent: 80,
        rejection_rate_percent: 20,
        avg_hours_to_review: 12,
        records_with_daily_notes: 8,
        records_without_daily_notes: 2,
        documentation_completeness_percent: 80,
      }),
    };
    csvExportService = { toCsv: jest.fn().mockReturnValue('csv-data') };

    controller = new AdminComplianceReportController(
      complianceService as never,
      csvExportService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return compliance report', async () => {
    const result = await controller.complianceReport(mockCurrentUser as never, {} as never);

    expect(result.message).toBe('Documentation compliance report generated');
  });

  it('should throw BadRequestException when user has no org_id', async () => {
    const noOrgUser = { ...mockCurrentUser, org_id: null };

    await expect(
      controller.complianceReport(noOrgUser as never, {} as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('should send CSV response for export', async () => {
    const res = { setHeader: jest.fn(), send: jest.fn() };

    await controller.exportCsv(mockCurrentUser as never, {} as never, res as never);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
  });
});
