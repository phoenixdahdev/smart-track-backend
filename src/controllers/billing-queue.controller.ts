import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingQueueService } from '@services/billing-queue.service';
import { BillingQueueQueryDto } from '@dtos/billing-queue-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Billing — Queue')
@ApiBearerAuth()
@Roles(AgencyRole.BILLING_SPECIALIST, AgencyRole.FINANCE_MANAGER)
@Controller('billing/queue')
export class BillingQueueController {
  constructor(private readonly billingQueueService: BillingQueueService) {}

  @ApiOperation({ summary: 'Get billing queue (approved, unbilled service records)' })
  @Get()
  async getQueue(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: BillingQueueQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.billingQueueService.getQueue(orgId, query, {
      date_from: query.date_from,
      date_to: query.date_to,
      individual_id: query.individual_id,
      program_id: query.program_id,
    });
    return {
      message: 'Billing queue retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get enriched details for a queue item' })
  @Get(':serviceRecordId/details')
  async enrichQueueItem(
    @Param('serviceRecordId', ParseUUIDPipe) serviceRecordId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.billingQueueService.enrichQueueItem(
      serviceRecordId,
      orgId,
    );
    return { message: 'Queue item details retrieved', data: result };
  }
}
