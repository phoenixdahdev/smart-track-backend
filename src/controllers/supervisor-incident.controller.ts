import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IncidentService } from '@services/incident.service';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { IsOptional, IsString } from 'class-validator';

export class CloseIncidentDto {
  @ApiPropertyOptional({ example: 'Reviewed and resolved. Follow-up scheduled.' })
  @IsString()
  @IsOptional()
  supervisor_comments?: string;
}

@ApiTags('Supervisor — Incidents')
@ApiBearerAuth()
@Roles(AgencyRole.SUPERVISOR)
@Controller('supervisor/incidents')
export class SupervisorIncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @ApiOperation({ summary: 'Get the incident review queue (SUBMITTED incidents)' })
  @Get('review-queue')
  async reviewQueue(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() pagination: PaginationValidator,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.incidentService.listPendingReview(
      orgId,
      pagination,
    );
    return {
      message: 'Incident review queue retrieved',
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

  @ApiOperation({ summary: 'Start reviewing an incident' })
  @Patch(':id/start-review')
  async startReview(
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

    const incident = await this.incidentService.startReview(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Incident review started', data: incident };
  }

  @ApiOperation({ summary: 'Close an incident' })
  @Patch(':id/close')
  async close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseIncidentDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const incident = await this.incidentService.close(
      id,
      orgId,
      dto.supervisor_comments,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Incident closed', data: incident };
  }
}
