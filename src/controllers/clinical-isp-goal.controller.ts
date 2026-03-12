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
import { IspGoalService } from '@services/isp-goal.service';
import { CreateIspGoalDto } from '@dtos/create-isp-goal.dto';
import { UpdateIspGoalDto } from '@dtos/update-isp-goal.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Clinical — ISP Goals')
@ApiBearerAuth()
@Roles(AgencyRole.CLINICIAN)
@Controller('clinical/isp-goals')
export class ClinicalIspGoalController {
  constructor(private readonly ispGoalService: IspGoalService) {}

  @ApiOperation({ summary: 'Create an ISP goal for an individual' })
  @Post()
  async create(
    @Body() dto: CreateIspGoalDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const goal = await this.ispGoalService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'ISP goal created',
      data: goal,
    };
  }

  @ApiOperation({ summary: 'List ISP goals for an individual' })
  @Roles(AgencyRole.CLINICIAN, AgencyRole.SUPERVISOR)
  @Get('by-individual/:individualId')
  async listByIndividual(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.ispGoalService.listByIndividual(
      individualId,
      orgId,
      pagination,
    );
    return {
      message: 'ISP goals retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get an ISP goal by ID' })
  @Roles(AgencyRole.CLINICIAN, AgencyRole.SUPERVISOR)
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

    const goal = await this.ispGoalService.findById(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'ISP goal retrieved',
      data: goal,
    };
  }

  @ApiOperation({ summary: 'Update an ISP goal' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIspGoalDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const goal = await this.ispGoalService.update(
      id,
      orgId,
      dto,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'ISP goal updated',
      data: goal,
    };
  }
}
