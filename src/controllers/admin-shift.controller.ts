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
import { ShiftService } from '@services/shift.service';
import { CreateShiftDto } from '@dtos/create-shift.dto';
import { UpdateShiftDto } from '@dtos/update-shift.dto';
import { ShiftQueryDto } from '@dtos/shift-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Admin — Shifts')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('admin/shifts')
export class AdminShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @ApiOperation({ summary: 'Create a DRAFT shift' })
  @Post()
  async create(
    @Body() dto: CreateShiftDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const shift = await this.shiftService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Shift created', data: shift };
  }

  @ApiOperation({ summary: 'List all shifts' })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ShiftQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.shiftService.listAll(orgId, query, {
      staff_id: query.staff_id,
      individual_id: query.individual_id,
      status: query.status,
      date_from: query.date_from,
      date_to: query.date_to,
    });
    return {
      message: 'Shifts retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'List shifts by staff member' })
  @Get('by-staff/:staffId')
  async listByStaff(
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.shiftService.listByStaff(
      staffId,
      orgId,
      pagination,
    );
    return {
      message: 'Shifts retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'List shifts by individual' })
  @Get('by-individual/:individualId')
  async listByIndividual(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.shiftService.listByIndividual(
      individualId,
      orgId,
      pagination,
    );
    return {
      message: 'Shifts retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get shift by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const shift = await this.shiftService.findById(id, orgId);
    return { message: 'Shift retrieved', data: shift };
  }

  @ApiOperation({ summary: 'Update a DRAFT shift' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShiftDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const shift = await this.shiftService.update(
      id,
      orgId,
      dto,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Shift updated', data: shift };
  }

  @ApiOperation({ summary: 'Publish a shift (DRAFT → PUBLISHED)' })
  @Patch(':id/publish')
  async publish(
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

    const shift = await this.shiftService.publish(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Shift published', data: shift };
  }

  @ApiOperation({ summary: 'Cancel a shift' })
  @Patch(':id/cancel')
  async cancel(
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

    const shift = await this.shiftService.cancel(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Shift cancelled', data: shift };
  }
}
