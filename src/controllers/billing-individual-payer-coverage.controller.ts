import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IndividualPayerCoverageService } from '@services/individual-payer-coverage.service';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';

@ApiTags('Billing — Individual Payer Coverages')
@ApiBearerAuth()
@Roles(AgencyRole.BILLING_SPECIALIST, AgencyRole.FINANCE_MANAGER)
@Controller('billing/individual-payer-coverages')
export class BillingIndividualPayerCoverageController {
  constructor(
    private readonly coverageService: IndividualPayerCoverageService,
  ) {}

  @ApiOperation({ summary: 'List individual payer coverages' })
  @Get()
  async list(
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.coverageService.list(orgId, pagination);
    return {
      message: 'Coverages retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get coverage by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const record = await this.coverageService.findById(id, orgId);
    return { message: 'Coverage retrieved', data: record };
  }

  @ApiOperation({ summary: 'List coverages by individual' })
  @Get('by-individual/:individualId')
  async listByIndividual(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.coverageService.listByIndividual(
      individualId,
      orgId,
      pagination,
    );
    return {
      message: 'Coverages retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }
}
