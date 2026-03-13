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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EvvPunchService } from '@services/evv-punch.service';
import { CreateEvvPunchDto } from '@dtos/create-evv-punch.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Staff — EVV Punches')
@ApiBearerAuth()
@Roles(AgencyRole.DSP)
@Controller('staff/evv-punches')
export class StaffEvvPunchController {
  constructor(private readonly evvPunchService: EvvPunchService) {}

  @ApiOperation({ summary: 'Clock in for an individual' })
  @Post('clock-in')
  async clockIn(
    @Body() dto: CreateEvvPunchDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const punch = await this.evvPunchService.clockIn(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Clock-in recorded', data: punch };
  }

  @ApiOperation({ summary: 'Clock out for an individual' })
  @Post('clock-out')
  async clockOut(
    @Body() dto: CreateEvvPunchDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const punch = await this.evvPunchService.clockOut(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Clock-out recorded', data: punch };
  }

  @ApiOperation({ summary: 'List my EVV punches' })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() pagination: PaginationValidator,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.evvPunchService.listByStaff(
      currentUser.id,
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
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const punch = await this.evvPunchService.findByIdForStaff(
      id,
      orgId,
      currentUser.id,
    );
    return { message: 'EVV punch retrieved', data: punch };
  }
}
