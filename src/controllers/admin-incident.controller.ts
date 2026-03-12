import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IncidentService } from '@services/incident.service';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Admin — Incidents')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('admin/incidents')
export class AdminIncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @ApiOperation({ summary: 'List all incidents in the organization' })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() pagination: PaginationValidator,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.incidentService.listAll(orgId, pagination);
    return {
      message: 'Incidents retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'List incidents by individual' })
  @Get('by-individual/:individualId')
  async listByIndividual(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.incidentService.listByIndividual(
      individualId,
      orgId,
      pagination,
    );
    return {
      message: 'Incidents retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get an incident by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const incident = await this.incidentService.findById(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Incident retrieved', data: incident };
  }
}
