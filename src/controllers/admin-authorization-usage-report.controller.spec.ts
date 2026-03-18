import { BadRequestException } from '@nestjs/common';
import { AdminAuthorizationUsageReportController } from './admin-authorization-usage-report.controller';

describe('AdminAuthorizationUsageReportController', () => {
  let controller: AdminAuthorizationUsageReportController;
  let authorizationUsageService: { getAuthorizationUsage: jest.Mock };
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
    authorizationUsageService = {
      getAuthorizationUsage: jest.fn().mockResolvedValue({
        authorizations: [],
        approaching_threshold: 0,
        exceeded: 0,
        expiring_soon: 0,
      }),
    };
    csvExportService = { toCsv: jest.fn().mockReturnValue('csv-data') };

    controller = new AdminAuthorizationUsageReportController(
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
  });
});
