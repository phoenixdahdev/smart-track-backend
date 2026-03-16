import {
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
import { AgencyManagementService } from '@services/agency-management.service';
import { SubscriptionManagementService } from '@services/subscription-management.service';
import { OrgManagementQueryDto } from '@dtos/org-management-query.dto';
import { UpdateOrgStatusDto } from '@dtos/update-org-status.dto';
import { ToggleModuleDto } from '@dtos/toggle-module.dto';
import { SetFeatureFlagDto } from '@dtos/set-feature-flag.dto';
import { UpdateSubscriptionDto } from '@dtos/update-subscription.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { PlatformRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { PaginationValidator } from '@utils/pagination-utils';

@ApiTags('SuperAdmin — Organizations')
@ApiBearerAuth()
@Roles(PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_ADMIN)
@Controller('superadmin/organizations')
export class SuperadminOrgController {
  constructor(
    private readonly agencyService: AgencyManagementService,
    private readonly subscriptionService: SubscriptionManagementService,
  ) {}

  @ApiOperation({ summary: 'List organizations' })
  @Get()
  async list(@Query() query: OrgManagementQueryDto) {
    const result = await this.agencyService.listOrganizations(query, {
      status: query.status,
      plan_tier: query.plan_tier,
      state: query.state,
    });
    return { message: 'Organizations retrieved', data: result.payload, meta: result.paginationMeta };
  }

  @ApiOperation({ summary: 'Get organization detail' })
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const org = await this.agencyService.getOrganization(id);
    return { message: 'Organization retrieved', data: org };
  }

  @ApiOperation({ summary: 'Update organization status' })
  @Post(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrgStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const org = await this.agencyService.updateOrgStatus(
      id, dto.status, dto.reason, currentUser.id, ip, ua,
    );
    return { message: 'Organization status updated', data: org };
  }

  @ApiOperation({ summary: 'Get organization contacts' })
  @Get(':id/contacts')
  async getContacts(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.agencyService.getContacts(id);
    return { message: 'Contacts retrieved', data: result.payload };
  }

  @ApiOperation({ summary: 'Get signed agreements' })
  @Get(':id/agreements')
  async getAgreements(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.agencyService.getAgreements(id);
    return { message: 'Agreements retrieved', data: result.payload };
  }

  @ApiOperation({ summary: 'Get organization modules' })
  @Get(':id/modules')
  async getModules(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.agencyService.getModules(id);
    return { message: 'Modules retrieved', data: result.payload };
  }

  @ApiOperation({ summary: 'Toggle organization module' })
  @Post(':id/modules')
  async toggleModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ToggleModuleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const result = await this.agencyService.toggleModule(
      id, dto.module_name, dto.enabled, currentUser.id, ip, ua,
    );
    return { message: `Module ${dto.enabled ? 'enabled' : 'disabled'}`, data: result };
  }

  @ApiOperation({ summary: 'Get organization feature flags' })
  @Get(':id/feature-flags')
  async getFeatureFlags(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.agencyService.getFeatureFlags(id);
    return { message: 'Feature flags retrieved', data: result.payload };
  }

  @ApiOperation({ summary: 'Set organization feature flag' })
  @Post(':id/feature-flags')
  async setFeatureFlag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetFeatureFlagDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const result = await this.agencyService.setFeatureFlag(
      id, dto.flag_name, dto.value, currentUser.id, dto.notes, ip, ua,
    );
    return { message: 'Feature flag set', data: result };
  }

  @ApiOperation({ summary: 'Get organization subscription' })
  @Get(':id/subscription')
  async getSubscription(@Param('id', ParseUUIDPipe) id: string) {
    const subscription = await this.subscriptionService.getSubscription(id);
    return { message: 'Subscription retrieved', data: subscription };
  }

  @ApiOperation({ summary: 'Update organization subscription' })
  @Patch(':id/subscription')
  async updateSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubscriptionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const subscription = await this.subscriptionService.updateSubscription(
      id, dto, currentUser.id, ip, ua,
    );
    return { message: 'Subscription updated', data: subscription };
  }

  @ApiOperation({ summary: 'List organization invoices' })
  @Get(':id/invoices')
  async listInvoices(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationValidator,
  ) {
    const result = await this.subscriptionService.listInvoices(id, query);
    return { message: 'Invoices retrieved', data: result.payload, meta: result.paginationMeta };
  }

  @ApiOperation({ summary: 'Create manual invoice' })
  @Post(':id/invoices')
  async createInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { amount_cents: number; due_date: string },
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const invoice = await this.subscriptionService.createInvoice(
      id, dto.amount_cents, dto.due_date, currentUser.id, ip, ua,
    );
    return { message: 'Invoice created', data: invoice };
  }
}
