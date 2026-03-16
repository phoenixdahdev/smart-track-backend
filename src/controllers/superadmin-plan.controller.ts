import {
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
import { SubscriptionManagementService } from '@services/subscription-management.service';
import { CreatePlanDefinitionDto } from '@dtos/create-plan-definition.dto';
import { UpdatePlanDefinitionDto } from '@dtos/update-plan-definition.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { PlatformRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('SuperAdmin — Plans')
@ApiBearerAuth()
@Roles(
  PlatformRole.PLATFORM_OWNER,
  PlatformRole.PLATFORM_ADMIN,
  PlatformRole.BILLING_OPERATOR,
)
@Controller('superadmin/platform/plans')
export class SuperadminPlanController {
  constructor(
    private readonly subscriptionService: SubscriptionManagementService,
  ) {}

  @ApiOperation({ summary: 'Create plan definition' })
  @Post()
  async create(
    @Body() dto: CreatePlanDefinitionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const plan = await this.subscriptionService.createPlan(
      dto, currentUser.id, ip, ua,
    );
    return { message: 'Plan created', data: plan };
  }

  @ApiOperation({ summary: 'List plan definitions' })
  @Get()
  async list() {
    const result = await this.subscriptionService.listPlans();
    return { message: 'Plans retrieved', data: result.payload };
  }

  @ApiOperation({ summary: 'Get plan definition by ID' })
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const plan = await this.subscriptionService.getPlan(id);
    return { message: 'Plan retrieved', data: plan };
  }

  @ApiOperation({ summary: 'Update plan definition' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDefinitionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const plan = await this.subscriptionService.updatePlan(
      id, dto, currentUser.id, ip, ua,
    );
    return { message: 'Plan updated', data: plan };
  }
}
