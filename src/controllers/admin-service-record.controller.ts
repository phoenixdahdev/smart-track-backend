import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ServiceRecordService } from '@services/service-record.service';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Admin — Service Records')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('admin/service-records')
export class AdminServiceRecordController {
  constructor(
    private readonly serviceRecordService: ServiceRecordService,
  ) {}

  @ApiOperation({ summary: 'List all service records in the organization' })
  @ApiQuery({ name: 'status', enum: ServiceRecordStatus, required: false })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() pagination: PaginationValidator,
    @Query('status') status?: ServiceRecordStatus,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.serviceRecordService.listAll(
      orgId,
      pagination,
      status,
    );
    return {
      message: 'Service records retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'List service records by individual' })
  @Get('by-individual/:individualId')
  async listByIndividual(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.serviceRecordService.listByIndividual(
      individualId,
      orgId,
      pagination,
    );
    return {
      message: 'Service records retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'List service records by staff member' })
  @Get('by-staff/:staffId')
  async listByStaff(
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.serviceRecordService.listByStaff(
      staffId,
      orgId,
      pagination,
    );
    return {
      message: 'Service records retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get a service record by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const record = await this.serviceRecordService.findById(id, orgId);
    return {
      message: 'Service record retrieved',
      data: record,
    };
  }
}
