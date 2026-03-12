import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IncidentService } from '@services/incident.service';
import { CreateIncidentDto } from '@dtos/create-incident.dto';
import { UpdateIncidentDto } from '@dtos/update-incident.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Staff — Incidents')
@ApiBearerAuth()
@Roles(AgencyRole.DSP)
@Controller('staff/incidents')
export class StaffIncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @ApiOperation({ summary: 'Report a new incident' })
  @Post()
  async create(
    @Body() dto: CreateIncidentDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const incident = await this.incidentService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Incident reported', data: incident };
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

  @ApiOperation({ summary: 'Update a draft incident' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const incident = await this.incidentService.update(
      id,
      orgId,
      dto,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Incident updated', data: incident };
  }

  @ApiOperation({ summary: 'Submit an incident for review' })
  @Patch(':id/submit')
  async submit(
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

    const incident = await this.incidentService.submit(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Incident submitted', data: incident };
  }
}
