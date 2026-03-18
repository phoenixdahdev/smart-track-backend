import { BadRequestException } from '@nestjs/common';
import { BillingAuthorizationUsageReportController } from './billing-authorization-usage-report.controller';

describe('BillingAuthorizationUsageReportController', () => {
  let controller: BillingAuthorizationUsageReportController;
  let authorizationUsageService: { getAuthorizationUsage: jest.Mock };
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
    authorizations: [{ auth_number: 'AUTH-001', utilization_percent: 60 }],
    approaching_threshold: 0,
    exceeded: 0,
    expiring_soon: 0,
  };

  beforeEach(() => {
    authorizationUsageService = {
      getAuthorizationUsage: jest.fn().mockResolvedValue(mockReport),
    };
    csvExportService = { toCsv: jest.fn().mockReturnValue('csv-data') };

    controller = new BillingAuthorizationUsageReportController(
      authorizationUsageService as never,
      csvExportService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return authorization usage report', async () => {
    const result = await controller.authorizationUsage(mockCurrentUser as never, {} as never);

    expect(result.message).toBe('Authorization usage report generated');
    expect(result.data.authorizations).toHaveLength(1);
  });

  it('should throw BadRequestException when user has no org_id', async () => {
    const noOrgUser = { ...mockCurrentUser, org_id: null };

    await expect(
      controller.authorizationUsage(noOrgUser as never, {} as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('should send CSV response for export', async () => {
    const res = { setHeader: jest.fn(), send: jest.fn() };

    await controller.exportCsv(mockCurrentUser as never, {} as never, res as never);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.send).toHaveBeenCalled();
  });
});
