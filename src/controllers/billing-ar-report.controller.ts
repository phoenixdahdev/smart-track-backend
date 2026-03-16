import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArReportService } from '@services/ar-report.service';
import { ArReportQueryDto } from '@dtos/ar-report-query.dto';
import { EftReconciliationQueryDto } from '@dtos/eft-reconciliation-query.dto';
import { FinancialDashboardQueryDto } from '@dtos/financial-dashboard-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Billing — Reports')
@ApiBearerAuth()
@Roles(AgencyRole.BILLING_SPECIALIST, AgencyRole.FINANCE_MANAGER)
@Controller('billing/reports')
export class BillingArReportController {
  constructor(private readonly arReportService: ArReportService) {}

  @ApiOperation({ summary: 'AR aging report' })
  @Get('ar-aging')
  async arAging(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ArReportQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const data = await this.arReportService.getArAgingReport(orgId, {
      payer_config_id: query.payer_config_id,
      individual_id: query.individual_id,
      as_of_date: query.as_of_date,
    });
    return { message: 'AR aging report generated', data };
  }

  @ApiOperation({ summary: 'EFT reconciliation report' })
  @Get('eft-reconciliation')
  async eftReconciliation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: EftReconciliationQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const data = await this.arReportService.getEftReconciliation(orgId, {
      date_from: query.date_from,
      date_to: query.date_to,
      payer_config_id: query.payer_config_id,
    });
    return { message: 'EFT reconciliation report generated', data };
  }

  @ApiOperation({ summary: 'Financial dashboard summary' })
  @Get('financial-dashboard')
  async financialDashboard(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FinancialDashboardQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const data = await this.arReportService.getFinancialDashboard(orgId, {
      date_from: query.date_from,
      date_to: query.date_to,
    });
    return { message: 'Financial dashboard generated', data };
  }

  @ApiOperation({ summary: 'Payer performance report' })
  @Get('payer-performance')
  async payerPerformance(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FinancialDashboardQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const data = await this.arReportService.getPayerPerformance(orgId, {
      date_from: query.date_from,
      date_to: query.date_to,
    });
    return { message: 'Payer performance report generated', data };
  }
}
