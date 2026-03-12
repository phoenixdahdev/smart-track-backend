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
import { BehaviorPlanService } from '@services/behavior-plan.service';
import { CreateBehaviorPlanDto } from '@dtos/create-behavior-plan.dto';
import { UpdateBehaviorPlanDto } from '@dtos/update-behavior-plan.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Clinical — Behavior Plans')
@ApiBearerAuth()
@Roles(AgencyRole.CLINICIAN)
@Controller('clinical/behavior-plans')
export class ClinicalBehaviorPlanController {
  constructor(
    private readonly behaviorPlanService: BehaviorPlanService,
  ) {}

  @ApiOperation({ summary: 'Create a new behavior plan' })
  @Post()
  async create(
    @Body() dto: CreateBehaviorPlanDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const plan = await this.behaviorPlanService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Behavior plan created', data: plan };
  }

  @ApiOperation({ summary: 'Create a new version of a behavior plan' })
  @Post('by-individual/:individualId/new-version')
  async createNewVersion(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @Body() dto: CreateBehaviorPlanDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const plan = await this.behaviorPlanService.createNewVersion(
      individualId,
      orgId,
      dto,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'New behavior plan version created', data: plan };
  }

  @ApiOperation({ summary: 'List behavior plans for an individual' })
  @Get('by-individual/:individualId')
  async listByIndividual(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.behaviorPlanService.listByIndividual(
      individualId,
      orgId,
      pagination,
    );
    return {
      message: 'Behavior plans retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get a behavior plan by ID' })
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

    const plan = await this.behaviorPlanService.findById(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Behavior plan retrieved', data: plan };
  }

  @ApiOperation({ summary: 'Update a behavior plan' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBehaviorPlanDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const plan = await this.behaviorPlanService.update(
      id,
      orgId,
      dto,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Behavior plan updated', data: plan };
  }
}
