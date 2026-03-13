import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceAuthorizationService } from '@services/service-authorization.service';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';

@ApiTags('Admin — Service Authorizations')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('admin/service-authorizations')
export class AdminServiceAuthorizationController {
  constructor(
    private readonly serviceAuthorizationService: ServiceAuthorizationService,
  ) {}

  @ApiOperation({ summary: 'List all service authorizations' })
  @Get()
  async list(
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.serviceAuthorizationService.list(orgId, pagination);
    return {
      message: 'Service authorizations retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get service authorization by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const record = await this.serviceAuthorizationService.findById(id, orgId);
    return { message: 'Service authorization retrieved', data: record };
  }

  @ApiOperation({ summary: 'List authorizations by individual' })
  @Get('by-individual/:individualId')
  async listByIndividual(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.serviceAuthorizationService.listByIndividual(
      individualId,
      orgId,
      pagination,
    );
    return {
      message: 'Service authorizations retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }
}
