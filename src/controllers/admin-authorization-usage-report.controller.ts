import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';
import { AuthorizationUsageService } from '@services/authorization-usage.service';
import { CsvExportService } from '@services/csv-export.service';
import { AuthorizationUsageQueryDto } from '@dtos/report-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { SkipResponseInterceptor } from '@decorators/skip-response-interceptor.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { type CsvColumn } from '@utils/csv-export';

const AUTH_USAGE_COLUMNS: CsvColumn[] = [
  { header: 'Auth Number', key: 'auth_number' },
  { header: 'Individual ID', key: 'individual_id' },
  { header: 'Units Authorized', key: 'units_authorized' },
  { header: 'Units Used', key: 'units_used' },
  { header: 'Units Pending', key: 'units_pending' },
  { header: 'Units Remaining', key: 'units_remaining' },
  { header: 'Utilization %', key: 'utilization_percent' },
  { header: 'Start Date', key: 'start_date' },
  { header: 'End Date', key: 'end_date' },
  { header: 'Days Until Expiry', key: 'days_until_expiry' },
  { header: 'Status', key: 'status' },
];

@ApiTags('Admin — Authorization Usage')
@ApiBearerAuth()
@Roles(AgencyRole.ADMIN, AgencyRole.AGENCY_OWNER)
@Controller('admin/reports/authorization-usage')
export class AdminAuthorizationUsageReportController {
  constructor(
    private readonly authorizationUsageService: AuthorizationUsageService,
    private readonly csvExportService: CsvExportService,
  ) {}

  @ApiOperation({ summary: 'Authorization usage report' })
  @Get()
  async authorizationUsage(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: AuthorizationUsageQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const data = await this.authorizationUsageService.getAuthorizationUsage(orgId, {
      individual_id: query.individual_id,
      payer_config_id: query.payer_config_id,
      service_code_id: query.service_code_id,
      alerts_only: query.alerts_only,
    });
    return { message: 'Authorization usage report generated', data };
  }

  @ApiOperation({ summary: 'Export authorization usage CSV' })
  @Get('export')
  @SkipResponseInterceptor()
  async exportCsv(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: AuthorizationUsageQueryDto,
    @Res() res: Response,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const data = await this.authorizationUsageService.getAuthorizationUsage(orgId, {
      individual_id: query.individual_id,
      payer_config_id: query.payer_config_id,
      service_code_id: query.service_code_id,
      alerts_only: query.alerts_only,
    });

    const csv = this.csvExportService.toCsv(
      data.authorizations as unknown as Record<string, unknown>[],
      AUTH_USAGE_COLUMNS,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="authorization-usage.csv"');
    res.send(csv);
  }
}
