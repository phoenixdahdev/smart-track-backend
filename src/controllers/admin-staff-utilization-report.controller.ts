import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';
import { StaffUtilizationService } from '@services/staff-utilization.service';
import { CsvExportService } from '@services/csv-export.service';
import { ReportDateRangeWithStaffQueryDto } from '@dtos/report-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { SkipResponseInterceptor } from '@decorators/skip-response-interceptor.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { type CsvColumn } from '@utils/csv-export';

const UTILIZATION_COLUMNS: CsvColumn[] = [
  { header: 'Staff ID', key: 'staff_id' },
  { header: 'Staff Name', key: 'staff_name' },
  { header: 'Hours Logged', key: 'hours_logged' },
  { header: 'Units Delivered', key: 'units_delivered' },
  { header: 'Shifts Scheduled', key: 'shifts_scheduled' },
  { header: 'Shifts Completed', key: 'shifts_completed' },
  { header: 'Fulfillment Rate %', key: 'shift_fulfillment_rate_percent' },
  { header: 'Records Submitted', key: 'service_records_submitted' },
];

@ApiTags('Admin — Staff Utilization')
@ApiBearerAuth()
@Roles(AgencyRole.ADMIN, AgencyRole.AGENCY_OWNER, AgencyRole.HR_MANAGER)
@Controller('admin/reports/staff-utilization')
export class AdminStaffUtilizationReportController {
  constructor(
    private readonly staffUtilizationService: StaffUtilizationService,
    private readonly csvExportService: CsvExportService,
  ) {}

  @ApiOperation({ summary: 'Staff utilization report' })
  @Get()
  async staffUtilization(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ReportDateRangeWithStaffQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const data = await this.staffUtilizationService.getStaffUtilization(orgId, {
      date_from: query.date_from,
      date_to: query.date_to,
      staff_id: query.staff_id,
      program_id: query.program_id,
    });
    return { message: 'Staff utilization report generated', data };
  }

  @ApiOperation({ summary: 'Export staff utilization CSV' })
  @Get('export')
  @SkipResponseInterceptor()
  async exportCsv(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ReportDateRangeWithStaffQueryDto,
    @Res() res: Response,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const data = await this.staffUtilizationService.getStaffUtilization(orgId, {
      date_from: query.date_from,
      date_to: query.date_to,
      staff_id: query.staff_id,
      program_id: query.program_id,
    });

    const csv = this.csvExportService.toCsv(
      data.staff as unknown as Record<string, unknown>[],
      UTILIZATION_COLUMNS,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="staff-utilization.csv"');
    res.send(csv);
  }
}
