import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Query,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShiftService } from '@services/shift.service';
import { RejectShiftDto } from '@dtos/reject-shift.dto';
import { ShiftQueryDto } from '@dtos/shift-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Staff — Shifts')
@ApiBearerAuth()
@Roles(AgencyRole.DSP)
@Controller('staff/shifts')
export class StaffShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @ApiOperation({ summary: 'List my shifts' })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ShiftQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.shiftService.listByStaff(
      currentUser.id,
      orgId,
      query,
      {
        status: query.status,
        date_from: query.date_from,
        date_to: query.date_to,
      },
    );
    return {
      message: 'Shifts retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get my shift by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const shift = await this.shiftService.findByIdForStaff(
      id,
      orgId,
      currentUser.id,
    );
    return { message: 'Shift retrieved', data: shift };
  }

  @ApiOperation({ summary: 'Accept a published shift' })
  @Patch(':id/accept')
  async accept(
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

    const shift = await this.shiftService.accept(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Shift accepted', data: shift };
  }

  @ApiOperation({ summary: 'Reject a published shift' })
  @Patch(':id/reject')
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectShiftDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const shift = await this.shiftService.reject(
      id,
      orgId,
      currentUser.id,
      dto.reason,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Shift rejected', data: shift };
  }
}
