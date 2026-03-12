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
import { IspDataPointService } from '@services/isp-data-point.service';
import { CreateIspDataPointDto } from '@dtos/create-isp-data-point.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Staff — ISP Data Points')
@ApiBearerAuth()
@Roles(AgencyRole.DSP)
@Controller('staff/isp-data-points')
export class StaffIspDataPointController {
  constructor(
    private readonly ispDataPointService: IspDataPointService,
  ) {}

  @ApiOperation({ summary: 'Record an ISP data point' })
  @Post()
  async create(
    @Body() dto: CreateIspDataPointDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const dataPoint = await this.ispDataPointService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'ISP data point recorded',
      data: dataPoint,
    };
  }

  @ApiOperation({ summary: 'List data points by goal' })
  @Get('by-goal/:goalId')
  async listByGoal(
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.ispDataPointService.listByGoal(
      goalId,
      orgId,
      pagination,
    );
    return {
      message: 'ISP data points retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'List data points by service record' })
  @Get('by-service-record/:serviceRecordId')
  async listByServiceRecord(
    @Param('serviceRecordId', ParseUUIDPipe) serviceRecordId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.ispDataPointService.listByServiceRecord(
      serviceRecordId,
      orgId,
    );
    return {
      message: 'ISP data points retrieved',
      data: result.payload,
    };
  }
}
