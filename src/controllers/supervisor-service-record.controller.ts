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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceRecordService } from '@services/service-record.service';
import { RejectServiceRecordDto } from '@dtos/review-service-record.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Supervisor — Service Records')
@ApiBearerAuth()
@Roles(AgencyRole.SUPERVISOR)
@Controller('supervisor/service-records')
export class SupervisorServiceRecordController {
  constructor(
    private readonly serviceRecordService: ServiceRecordService,
  ) {}

  @ApiOperation({ summary: 'Get the review queue (PENDING_REVIEW records)' })
  @Get('review-queue')
  async reviewQueue(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() pagination: PaginationValidator,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.serviceRecordService.listPendingReview(
      orgId,
      pagination,
    );
    return {
      message: 'Review queue retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get a service record by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const record = await this.serviceRecordService.findById(id, orgId);
    return {
      message: 'Service record retrieved',
      data: record,
    };
  }

  @ApiOperation({ summary: 'Approve a service record' })
  @Patch(':id/approve')
  async approve(
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

    const record = await this.serviceRecordService.approve(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Service record approved',
      data: record,
    };
  }

  @ApiOperation({ summary: 'Reject a service record' })
  @Patch(':id/reject')
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectServiceRecordDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const record = await this.serviceRecordService.reject(
      id,
      orgId,
      currentUser.id,
      dto.rejection_reason,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Service record rejected',
      data: record,
    };
  }
}
