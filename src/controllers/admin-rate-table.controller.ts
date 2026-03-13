import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RateTableService } from '@services/rate-table.service';
import { CreateRateTableDto } from '@dtos/create-rate-table.dto';
import { UpdateRateTableDto } from '@dtos/update-rate-table.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Admin — Rate Tables')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('admin/rate-tables')
export class AdminRateTableController {
  constructor(private readonly rateTableService: RateTableService) {}

  @ApiOperation({ summary: 'Create a rate table entry' })
  @Post()
  async create(
    @Body() dto: CreateRateTableDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const record = await this.rateTableService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Rate table created', data: record };
  }

  @ApiOperation({ summary: 'List rate table entries' })
  @Get()
  async list(
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.rateTableService.list(orgId, pagination);
    return {
      message: 'Rate tables retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Lookup rate for payer/service code/date' })
  @ApiQuery({ name: 'payer_config_id', required: true })
  @ApiQuery({ name: 'service_code_id', required: true })
  @ApiQuery({ name: 'service_date', required: true, example: '2026-03-01' })
  @Get('lookup')
  async lookup(
    @Query('payer_config_id') payerConfigId: string,
    @Query('service_code_id') serviceCodeId: string,
    @Query('service_date') serviceDate: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const rate = await this.rateTableService.findRate(
      payerConfigId,
      serviceCodeId,
      serviceDate,
      orgId,
    );
    return { message: 'Rate lookup complete', data: rate };
  }

  @ApiOperation({ summary: 'Get rate table entry by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const record = await this.rateTableService.findById(id, orgId);
    return { message: 'Rate table retrieved', data: record };
  }

  @ApiOperation({ summary: 'Update a rate table entry' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRateTableDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const record = await this.rateTableService.update(
      id,
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Rate table updated', data: record };
  }

  @ApiOperation({ summary: 'Deactivate a rate table entry' })
  @Delete(':id')
  async deactivate(
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

    const record = await this.rateTableService.deactivate(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Rate table deactivated', data: record };
  }
}
