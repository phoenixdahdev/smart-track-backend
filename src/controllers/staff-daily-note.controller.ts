import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DailyNoteService } from '@services/daily-note.service';
import { CreateDailyNoteDto } from '@dtos/create-daily-note.dto';
import { UpdateDailyNoteDto } from '@dtos/update-daily-note.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Staff — Daily Notes')
@ApiBearerAuth()
@Roles(AgencyRole.DSP)
@Controller('staff/service-records/:serviceRecordId/daily-notes')
export class StaffDailyNoteController {
  constructor(private readonly dailyNoteService: DailyNoteService) {}

  @ApiOperation({ summary: 'Create a daily note for a service record' })
  @Post()
  async create(
    @Param('serviceRecordId', ParseUUIDPipe) serviceRecordId: string,
    @Body() dto: CreateDailyNoteDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const note = await this.dailyNoteService.create(
      serviceRecordId,
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Daily note created',
      data: note,
    };
  }

  @ApiOperation({ summary: 'List daily notes for a service record' })
  @Get()
  async list(
    @Param('serviceRecordId', ParseUUIDPipe) serviceRecordId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.dailyNoteService.findByServiceRecord(
      serviceRecordId,
      orgId,
    );
    return {
      message: 'Daily notes retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get a daily note by ID' })
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

    const note = await this.dailyNoteService.findById(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Daily note retrieved',
      data: note,
    };
  }

  @ApiOperation({ summary: 'Update a daily note' })
  @Patch(':id')
  async update(
    @Param('serviceRecordId', ParseUUIDPipe) serviceRecordId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDailyNoteDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const note = await this.dailyNoteService.update(
      id,
      serviceRecordId,
      orgId,
      dto,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Daily note updated',
      data: note,
    };
  }
}
