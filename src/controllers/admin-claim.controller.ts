import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClaimService } from '@services/claim.service';
import { ClaimQueryDto } from '@dtos/claim-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';

@ApiTags('Admin — Claims')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('admin/claims')
export class AdminClaimController {
  constructor(private readonly claimService: ClaimService) {}

  @ApiOperation({ summary: 'List all claims' })
  @Get()
  async list(
    @CurrentUser('org_id') orgId: string,
    @Query() query: ClaimQueryDto,
  ) {
    const result = await this.claimService.list(orgId, query, {
      status: query.status,
      individual_id: query.individual_id,
    });
    return {
      message: 'Claims retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get claim by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const claim = await this.claimService.findById(id, orgId);
    return { message: 'Claim retrieved', data: claim };
  }

  @ApiOperation({ summary: 'Get claim status history' })
  @Get(':id/history')
  async history(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.claimService.getStatusHistory(id, orgId);
    return {
      message: 'Status history retrieved',
      data: result.payload,
    };
  }
}
