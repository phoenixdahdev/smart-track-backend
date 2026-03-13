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
import { ServiceAuthorizationService } from '@services/service-authorization.service';
import { CreateServiceAuthorizationDto } from '@dtos/create-service-authorization.dto';
import { UpdateServiceAuthorizationDto } from '@dtos/update-service-authorization.dto';
import { VoidServiceAuthorizationDto } from '@dtos/void-service-authorization.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Billing — Service Authorizations')
@ApiBearerAuth()
@Roles(AgencyRole.BILLING_SPECIALIST, AgencyRole.FINANCE_MANAGER)
@Controller('billing/service-authorizations')
export class BillingServiceAuthorizationController {
  constructor(
    private readonly serviceAuthorizationService: ServiceAuthorizationService,
  ) {}

  @ApiOperation({ summary: 'Create a service authorization' })
  @Post()
  async create(
    @Body() dto: CreateServiceAuthorizationDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const record = await this.serviceAuthorizationService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Service authorization created', data: record };
  }

  @ApiOperation({ summary: 'List service authorizations' })
  @Get()
  async list(
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.serviceAuthorizationService.list(orgId, pagination);
    return {
      message: 'Service authorizations retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get service authorization by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const record = await this.serviceAuthorizationService.findById(id, orgId);
    return { message: 'Service authorization retrieved', data: record };
  }

  @ApiOperation({ summary: 'Update a service authorization' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceAuthorizationDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const record = await this.serviceAuthorizationService.update(
      id,
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Service authorization updated', data: record };
  }

  @ApiOperation({ summary: 'Void a service authorization' })
  @Post(':id/void')
  async void(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidServiceAuthorizationDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const record = await this.serviceAuthorizationService.void(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      dto.reason,
      ip,
      userAgent,
    );
    return { message: 'Service authorization voided', data: record };
  }

  @ApiOperation({ summary: 'Check authorization thresholds' })
  @Get(':id/thresholds')
  async thresholds(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.serviceAuthorizationService.checkThresholds(
      id,
      orgId,
    );
    return { message: 'Thresholds retrieved', data: result };
  }

  @ApiOperation({ summary: 'List authorizations by individual' })
  @Get('by-individual/:individualId')
  async listByIndividual(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.serviceAuthorizationService.listByIndividual(
      individualId,
      orgId,
      pagination,
    );
    return {
      message: 'Service authorizations retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }
}
