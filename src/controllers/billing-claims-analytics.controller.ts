import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';
import { ClaimsAnalyticsService } from '@services/claims-analytics.service';
import { CsvExportService } from '@services/csv-export.service';
import { ReportDateRangeWithPayerQueryDto } from '@dtos/report-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { SkipResponseInterceptor } from '@decorators/skip-response-interceptor.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { centsToDollars, type CsvColumn } from '@utils/csv-export';

const LIFECYCLE_COLUMNS: CsvColumn[] = [
  { header: 'Status', key: 'status' },
  { header: 'Count', key: 'count' },
  { header: 'Total Charge', key: 'total_charge_cents', transform: (v) => centsToDollars(Number(v)) },
];

const DENIAL_COLUMNS: CsvColumn[] = [
  { header: 'Reason Code', key: 'reason_code' },
  { header: 'Count', key: 'count' },
  { header: 'Total Charge', key: 'total_charge_cents', transform: (v) => centsToDollars(Number(v)) },
  { header: 'Percentage', key: 'percentage' },
];

@ApiTags('Billing — Claims Analytics')
@ApiBearerAuth()
@Roles(AgencyRole.BILLING_SPECIALIST, AgencyRole.FINANCE_MANAGER)
@Controller('billing/reports/claims-lifecycle')
export class BillingClaimsAnalyticsController {
  constructor(
    private readonly claimsAnalyticsService: ClaimsAnalyticsService,
    private readonly csvExportService: CsvExportService,
  ) {}

  @ApiOperation({ summary: 'Claims lifecycle report' })
  @Get()
  async claimsLifecycle(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ReportDateRangeWithPayerQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const data = await this.claimsAnalyticsService.getClaimsLifecycle(orgId, {
      date_from: query.date_from,
      date_to: query.date_to,
      payer_config_id: query.payer_config_id,
      individual_id: query.individual_id,
    });
    return { message: 'Claims lifecycle report generated', data };
  }

  @ApiOperation({ summary: 'Denial analysis breakdown' })
  @Get('denial-analysis')
  async denialAnalysis(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ReportDateRangeWithPayerQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const data = await this.claimsAnalyticsService.getDenialAnalysis(orgId, {
      date_from: query.date_from,
      date_to: query.date_to,
      payer_config_id: query.payer_config_id,
      individual_id: query.individual_id,
    });
    return { message: 'Denial analysis generated', data };
  }

  @ApiOperation({ summary: 'Export claims lifecycle CSV' })
  @Get('export')
  @SkipResponseInterceptor()
  async exportCsv(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ReportDateRangeWithPayerQueryDto,
    @Res() res: Response,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const report = await this.claimsAnalyticsService.getClaimsLifecycle(orgId, {
      date_from: query.date_from,
      date_to: query.date_to,
      payer_config_id: query.payer_config_id,
      individual_id: query.individual_id,
    });

    const statusCsv = this.csvExportService.toCsv(
      report.by_status as unknown as Record<string, unknown>[],
      LIFECYCLE_COLUMNS,
    );
    const denialCsv = this.csvExportService.toCsv(
      report.denial_analysis as unknown as Record<string, unknown>[],
      DENIAL_COLUMNS,
    );

    const csv = `Claims by Status\n${statusCsv}\n\nDenial Analysis\n${denialCsv}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="claims-lifecycle.csv"');
    res.send(csv);
  }
}
