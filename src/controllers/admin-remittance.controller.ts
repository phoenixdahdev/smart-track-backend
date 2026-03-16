import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RemittanceService } from '@services/remittance.service';
import { RemittanceQueryDto } from '@dtos/remittance-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Admin — Remittances')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('admin/remittances')
export class AdminRemittanceController {
  constructor(private readonly remittanceService: RemittanceService) {}

  @ApiOperation({ summary: 'List remittances (read-only)' })
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
}
