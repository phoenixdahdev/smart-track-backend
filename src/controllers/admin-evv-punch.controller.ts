import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EvvPunchService } from '@services/evv-punch.service';
import { EvvPunchQueryDto } from '@dtos/evv-punch-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Admin — EVV Punches')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('admin/evv-punches')
export class AdminEvvPunchController {
  constructor(private readonly evvPunchService: EvvPunchService) {}

  @ApiOperation({ summary: 'List all EVV punches in the organization' })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: EvvPunchQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.evvPunchService.listAll(orgId, query, {
      staff_id: query.staff_id,
      individual_id: query.individual_id,
      punch_type: query.punch_type,
    });
    return {
      message: 'EVV punches retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get aggregate EVV stats' })
  @ApiQuery({ name: 'date_from', required: false, example: '2026-03-01' })
  @ApiQuery({ name: 'date_to', required: false, example: '2026-03-31' })
  @Get('summary')
  async summary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.evvPunchService.getSummary(orgId, dateFrom, dateTo);
    return { message: 'EVV summary retrieved', data: result };
  }

  @ApiOperation({ summary: 'List punches by staff member' })
  @Get('by-staff/:staffId')
  async listByStaff(
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.evvPunchService.listByStaff(
      staffId,
      orgId,
      pagination,
    );
    return {
      message: 'EVV punches retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'List punches by individual' })
  @Get('by-individual/:individualId')
  async listByIndividual(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.evvPunchService.listByIndividual(
      individualId,
      orgId,
      pagination,
    );
    return {
      message: 'EVV punches retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get an EVV punch by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const punch = await this.evvPunchService.findById(id, orgId);
    return { message: 'EVV punch retrieved', data: punch };
  }
}
