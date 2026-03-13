import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EvvPunchService } from '@services/evv-punch.service';
import { EvvCorrectionService } from '@services/evv-correction.service';
import { FlagMissedPunchDto } from '@dtos/flag-missed-punch.dto';
import { EvvPunchQueryDto } from '@dtos/evv-punch-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Supervisor — EVV Punches')
@ApiBearerAuth()
@Roles(AgencyRole.SUPERVISOR, AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('supervisor/evv-punches')
export class SupervisorEvvPunchController {
  constructor(
    private readonly evvPunchService: EvvPunchService,
    private readonly evvCorrectionService: EvvCorrectionService,
  ) {}

  @ApiOperation({ summary: 'List all EVV punches' })
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

  @ApiOperation({ summary: 'Get missed punches (open sessions past threshold)' })
  @ApiQuery({ name: 'threshold_hours', required: false, example: 12 })
  @Get('missed')
  async missed(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('threshold_hours') thresholdHours?: string,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const threshold = thresholdHours ? parseInt(thresholdHours, 10) : 12;
    const result = await this.evvPunchService.findMissedPunches(orgId, threshold);
    return { message: 'Missed punches retrieved', data: result };
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

  @ApiOperation({ summary: 'Get an EVV punch by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const punch = await this.evvPunchService.findById(id, orgId);
    return { message: 'EVV punch retrieved', data: punch };
  }

  @ApiOperation({ summary: 'Flag a missed punch — auto-creates correction' })
  @Post('flag-missed')
  async flagMissed(
    @Body() dto: FlagMissedPunchDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const correction = await this.evvCorrectionService.flagMissedPunch(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Missed punch flagged', data: correction };
  }
}
