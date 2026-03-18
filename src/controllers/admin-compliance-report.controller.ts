import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';
import { DocumentationComplianceService } from '@services/documentation-compliance.service';
import { CsvExportService } from '@services/csv-export.service';
import { ReportDateRangeWithStaffQueryDto } from '@dtos/report-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { SkipResponseInterceptor } from '@decorators/skip-response-interceptor.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { type CsvColumn } from '@utils/csv-export';

const COMPLIANCE_COLUMNS: CsvColumn[] = [
  { header: 'Total Records', key: 'total_records' },
  { header: 'Approval Rate %', key: 'approval_rate_percent' },
  { header: 'Rejection Rate %', key: 'rejection_rate_percent' },
  { header: 'Avg Hours to Review', key: 'avg_hours_to_review' },
  { header: 'With Daily Notes', key: 'records_with_daily_notes' },
  { header: 'Without Daily Notes', key: 'records_without_daily_notes' },
  { header: 'Completeness %', key: 'documentation_completeness_percent' },
];

@ApiTags('Admin — Documentation Compliance')
@ApiBearerAuth()
@Roles(AgencyRole.ADMIN, AgencyRole.AGENCY_OWNER)
@Controller('admin/reports/documentation')
export class AdminComplianceReportController {
  constructor(
    private readonly complianceService: DocumentationComplianceService,
    private readonly csvExportService: CsvExportService,
  ) {}

  @ApiOperation({ summary: 'Documentation compliance report' })
  @Get()
  async complianceReport(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ReportDateRangeWithStaffQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const data = await this.complianceService.getComplianceReport(orgId, {
      date_from: query.date_from,
      date_to: query.date_to,
      staff_id: query.staff_id,
      program_id: query.program_id,
    });
    return { message: 'Documentation compliance report generated', data };
  }

  @ApiOperation({ summary: 'Export documentation compliance CSV' })
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

    const data = await this.complianceService.getComplianceReport(orgId, {
      date_from: query.date_from,
      date_to: query.date_to,
      staff_id: query.staff_id,
      program_id: query.program_id,
    });

    const csv = this.csvExportService.toCsv(
      [data as unknown as Record<string, unknown>],
      COMPLIANCE_COLUMNS,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="documentation-compliance.csv"');
    res.send(csv);
  }
}
