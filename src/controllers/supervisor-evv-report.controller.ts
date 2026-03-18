import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';
import { EvvComplianceService } from '@services/evv-compliance.service';
import { CsvExportService } from '@services/csv-export.service';
import { ReportDateRangeWithStaffQueryDto } from '@dtos/report-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { SkipResponseInterceptor } from '@decorators/skip-response-interceptor.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { type CsvColumn } from '@utils/csv-export';

const EVV_COLUMNS: CsvColumn[] = [
  { header: 'Total Punches', key: 'total_punches' },
  { header: 'Clock In', key: 'clock_in_count' },
  { header: 'Clock Out', key: 'clock_out_count' },
  { header: 'GPS Confirmed', key: 'gps_confirmed_count' },
  { header: 'GPS Rate %', key: 'gps_confirmation_rate_percent' },
  { header: 'Missed Punches', key: 'missed_punch_count' },
  { header: 'Corrections', key: 'correction_count' },
  { header: 'Approved', key: 'corrections_approved' },
  { header: 'Rejected', key: 'corrections_rejected' },
  { header: 'Pending', key: 'corrections_pending' },
];

@ApiTags('Supervisor — EVV Compliance')
@ApiBearerAuth()
@Roles(AgencyRole.SUPERVISOR)
@Controller('supervisor/reports/evv')
export class SupervisorEvvReportController {
  constructor(
    private readonly evvComplianceService: EvvComplianceService,
    private readonly csvExportService: CsvExportService,
  ) {}

  @ApiOperation({ summary: 'EVV compliance report' })
  @Get()
  async evvReport(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ReportDateRangeWithStaffQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const data = await this.evvComplianceService.getEvvComplianceReport(orgId, {
      date_from: query.date_from,
      date_to: query.date_to,
      staff_id: query.staff_id,
    });
    return { message: 'EVV compliance report generated', data };
  }

  @ApiOperation({ summary: 'Export EVV compliance CSV' })
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

    const data = await this.evvComplianceService.getEvvComplianceReport(orgId, {
      date_from: query.date_from,
      date_to: query.date_to,
      staff_id: query.staff_id,
    });

    const csv = this.csvExportService.toCsv(
      [data as unknown as Record<string, unknown>],
      EVV_COLUMNS,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="evv-compliance.csv"');
    res.send(csv);
  }
}
