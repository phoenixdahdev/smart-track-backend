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
import { AdlEntryService } from '@services/adl-entry.service';
import { CreateAdlEntryDto } from '@dtos/create-adl-entry.dto';
import { UpdateAdlEntryDto } from '@dtos/update-adl-entry.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Staff — ADL Entries')
@ApiBearerAuth()
@Roles(AgencyRole.DSP)
@Controller('staff/adl-entries')
export class StaffAdlEntryController {
  constructor(private readonly adlEntryService: AdlEntryService) {}

  @ApiOperation({ summary: 'Create a single ADL entry' })
  @Post()
  async create(
    @Body() dto: CreateAdlEntryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const entry = await this.adlEntryService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'ADL entry created', data: entry };
  }

  @ApiOperation({ summary: 'Create multiple ADL entries for a shift' })
  @Post('bulk')
  async bulkCreate(
    @Body() entries: CreateAdlEntryDto[],
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const created = await this.adlEntryService.bulkCreate(
      entries,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: `${created.length} ADL entries created`, data: created };
  }

  @ApiOperation({ summary: 'List ADL entries for a service record' })
  @Get('service-record/:serviceRecordId')
  async listByServiceRecord(
    @Param('serviceRecordId', ParseUUIDPipe) serviceRecordId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.adlEntryService.findByServiceRecord(
      serviceRecordId,
      orgId,
    );
    return {
      message: 'ADL entries retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get an ADL entry by ID' })
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

    const entry = await this.adlEntryService.findById(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'ADL entry retrieved', data: entry };
  }

  @ApiOperation({ summary: 'Update an ADL entry' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdlEntryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const entry = await this.adlEntryService.update(
      id,
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'ADL entry updated', data: entry };
  }
}
