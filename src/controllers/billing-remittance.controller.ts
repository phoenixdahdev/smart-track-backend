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
import { RemittanceService } from '@services/remittance.service';
import { IngestEraDto } from '@dtos/ingest-era.dto';
import { RemittanceQueryDto } from '@dtos/remittance-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Billing — Remittances')
@ApiBearerAuth()
@Roles(AgencyRole.BILLING_SPECIALIST, AgencyRole.FINANCE_MANAGER)
@Controller('billing/remittances')
export class BillingRemittanceController {
  constructor(private readonly remittanceService: RemittanceService) {}

  @ApiOperation({ summary: 'Ingest ERA (835) remittance' })
  @Post()
  async ingest(
    @Body() dto: IngestEraDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const result = await this.remittanceService.ingestEra(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'ERA ingested', data: result };
  }

  @ApiOperation({ summary: 'List remittances' })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: RemittanceQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.remittanceService.list(orgId, query, {
      status: query.status,
      date_from: query.date_from,
      date_to: query.date_to,
      payer_config_id: query.payer_config_id,
    });
    return {
      message: 'Remittances retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get remittance by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const remittance = await this.remittanceService.findById(id, orgId);
    return { message: 'Remittance retrieved', data: remittance };
  }

  @ApiOperation({ summary: 'Get payment posts for a remittance' })
  @Get(':id/payment-posts')
  async getPaymentPosts(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.remittanceService.getPaymentPosts(id, orgId);
    return {
      message: 'Payment posts retrieved',
      data: result.payload,
    };
  }

  @ApiOperation({ summary: 'Recalculate remittance status' })
  @Post(':id/recalculate')
  async recalculate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.remittanceService.recalculateStatus(id, orgId);
    return { message: 'Remittance status recalculated', data: result };
  }
}
