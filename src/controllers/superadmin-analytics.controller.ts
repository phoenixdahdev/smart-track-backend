import {
  Controller,
  Get,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';
import { PlatformAnalyticsService } from '@services/platform-analytics.service';
import { CsvExportService } from '@services/csv-export.service';
import { Roles } from '@decorators/roles.decorator';
import { SkipResponseInterceptor } from '@decorators/skip-response-interceptor.decorator';
import { PlatformRole } from '@enums/role.enum';
import { centsToDollars, type CsvColumn } from '@utils/csv-export';

const HEALTH_COLUMNS: CsvColumn[] = [
  { header: 'Org ID', key: 'org_id' },
  { header: 'Legal Name', key: 'legal_name' },
  { header: 'Plan Tier', key: 'plan_tier' },
  { header: 'Active Users', key: 'active_users' },
  { header: 'Claims (30d)', key: 'claims_submitted_30d' },
  { header: 'Success Rate %', key: 'claim_success_rate_percent' },
  { header: 'Health Score', key: 'health_score' },
];

const MRR_COLUMNS: CsvColumn[] = [
  { header: 'Tier', key: 'tier' },
  { header: 'Count', key: 'count' },
  { header: 'MRR', key: 'mrr_cents', transform: (v) => centsToDollars(Number(v)) },
];

@ApiTags('SuperAdmin — Platform Analytics')
@ApiBearerAuth()
@Roles(PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_ADMIN)
@Controller('superadmin/platform/analytics')
export class SuperadminAnalyticsController {
  constructor(
    private readonly platformAnalyticsService: PlatformAnalyticsService,
    private readonly csvExportService: CsvExportService,
  ) {}

  @ApiOperation({ summary: 'Full platform analytics' })
  @Get()
  async platformAnalytics() {
    const data = await this.platformAnalyticsService.getPlatformAnalytics();
    return { message: 'Platform analytics generated', data };
  }

  @ApiOperation({ summary: 'Agency health scores' })
  @Get('agency-health')
  async agencyHealth() {
    const data = await this.platformAnalyticsService.getAgencyHealthScores();
    return { message: 'Agency health scores generated', data };
  }

  @ApiOperation({ summary: 'Export platform analytics CSV' })
  @Get('export')
  @SkipResponseInterceptor()
  async exportCsv(@Res() res: Response) {
    const report = await this.platformAnalyticsService.getPlatformAnalytics();

    const mrrCsv = this.csvExportService.toCsv(
      report.mrr_by_tier as unknown as Record<string, unknown>[],
      MRR_COLUMNS,
    );
    const healthCsv = this.csvExportService.toCsv(
      report.agency_health_scores as unknown as Record<string, unknown>[],
      HEALTH_COLUMNS,
    );

    const csv = `Platform Summary\nTotal Agencies,${report.total_agencies}\nActive Agencies,${report.active_agencies}\nTotal MRR,${centsToDollars(report.total_mrr_cents)}\nAvg Claims/Agency,${report.avg_claims_per_agency}\n\nMRR by Tier\n${mrrCsv}\n\nAgency Health Scores\n${healthCsv}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="platform-analytics.csv"');
    res.send(csv);
  }
}
