import { BadRequestException } from '@nestjs/common';
import { SupervisorEvvReportController } from './supervisor-evv-report.controller';

describe('SupervisorEvvReportController', () => {
  let controller: SupervisorEvvReportController;
  let evvComplianceService: { getEvvComplianceReport: jest.Mock };
  let csvExportService: { toCsv: jest.Mock };

  const mockCurrentUser = {
    id: 'sup-uuid',
    org_id: 'org-uuid',
    role: 'SUPERVISOR',
    email: 'sup@test.com',
    name: 'Supervisor',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  const mockReport = {
    total_punches: 20,
    clock_in_count: 10,
    clock_out_count: 10,
    gps_confirmed_count: 18,
    gps_confirmation_rate_percent: 90,
    missed_punch_count: 2,
    correction_count: 3,
    corrections_approved: 1,
    corrections_rejected: 1,
    corrections_pending: 1,
  };

  beforeEach(() => {
    evvComplianceService = {
      getEvvComplianceReport: jest.fn().mockResolvedValue(mockReport),
    };
    csvExportService = { toCsv: jest.fn().mockReturnValue('csv-data') };

    controller = new SupervisorEvvReportController(
      evvComplianceService as never,
      csvExportService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return EVV compliance report', async () => {
    const result = await controller.evvReport(mockCurrentUser as never, {} as never);

    expect(result.message).toBe('EVV compliance report generated');
    expect(result.data.total_punches).toBe(20);
  });

  it('should throw BadRequestException when user has no org_id', async () => {
    const noOrgUser = { ...mockCurrentUser, org_id: null };

    await expect(
      controller.evvReport(noOrgUser as never, {} as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('should send CSV response for export', async () => {
    const res = { setHeader: jest.fn(), send: jest.fn() };

    await controller.exportCsv(mockCurrentUser as never, {} as never, res as never);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.send).toHaveBeenCalled();
  });
});
