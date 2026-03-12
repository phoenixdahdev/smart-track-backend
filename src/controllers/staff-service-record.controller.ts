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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ServiceRecordService } from '@services/service-record.service';
import { CreateServiceRecordDto } from '@dtos/create-service-record.dto';
import { UpdateServiceRecordDto } from '@dtos/update-service-record.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Staff — Service Records')
@ApiBearerAuth()
@Roles(AgencyRole.DSP)
@Controller('staff/service-records')
export class StaffServiceRecordController {
  constructor(
    private readonly serviceRecordService: ServiceRecordService,
  ) {}

  @ApiOperation({ summary: 'Create a new service record' })
  @Post()
  async create(
    @Body() dto: CreateServiceRecordDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const record = await this.serviceRecordService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Service record created',
      data: record,
    };
  }

  @ApiOperation({ summary: 'List my service records' })
  @ApiQuery({ name: 'status', enum: ServiceRecordStatus, required: false })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() pagination: PaginationValidator,
    @Query('status') status?: ServiceRecordStatus,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.serviceRecordService.listByStaff(
      currentUser.id,
      orgId,
      pagination,
      status,
    );
    return {
      message: 'Service records retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get a service record by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const record = await this.serviceRecordService.findByIdForStaff(
      id,
      orgId,
      currentUser.id,
    );
    return {
      message: 'Service record retrieved',
      data: record,
    };
  }

  @ApiOperation({ summary: 'Update a draft or rejected service record' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceRecordDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const record = await this.serviceRecordService.update(
      id,
      orgId,
      currentUser.id,
      dto,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Service record updated',
      data: record,
    };
  }

  @ApiOperation({ summary: 'Submit a service record for review' })
  @Patch(':id/submit')
  async submitForReview(
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

    const record = await this.serviceRecordService.submitForReview(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Service record submitted for review',
      data: record,
    };
  }
}
