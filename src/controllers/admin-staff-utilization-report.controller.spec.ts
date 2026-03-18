import { BadRequestException } from '@nestjs/common';
import { AdminStaffUtilizationReportController } from './admin-staff-utilization-report.controller';

describe('AdminStaffUtilizationReportController', () => {
  let controller: AdminStaffUtilizationReportController;
  let staffUtilizationService: { getStaffUtilization: jest.Mock };
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
    staffUtilizationService = {
      getStaffUtilization: jest.fn().mockResolvedValue({
        staff: [{ staff_id: 'staff-1', staff_name: 'John', hours_logged: 8 }],
        total_hours_logged: 8,
        total_units_delivered: 4,
        avg_hours_per_staff: 8,
      }),
    };
    csvExportService = { toCsv: jest.fn().mockReturnValue('csv-data') };

    controller = new AdminStaffUtilizationReportController(
      staffUtilizationService as never,
      csvExportService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return staff utilization report', async () => {
    const result = await controller.staffUtilization(mockCurrentUser as never, {} as never);

    expect(result.message).toBe('Staff utilization report generated');
    expect(result.data.staff).toHaveLength(1);
  });

  it('should throw BadRequestException when user has no org_id', async () => {
    const noOrgUser = { ...mockCurrentUser, org_id: null };

    await expect(
      controller.staffUtilization(noOrgUser as never, {} as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('should send CSV response for export', async () => {
    const res = { setHeader: jest.fn(), send: jest.fn() };

    await controller.exportCsv(mockCurrentUser as never, {} as never, res as never);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.send).toHaveBeenCalled();
  });
});
