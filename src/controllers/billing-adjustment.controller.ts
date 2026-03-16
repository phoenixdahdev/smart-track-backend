import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentPostingService } from '@services/payment-posting.service';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';

@ApiTags('Billing — Adjustments')
@ApiBearerAuth()
@Roles(AgencyRole.BILLING_SPECIALIST, AgencyRole.FINANCE_MANAGER)
@Controller('billing/adjustments')
export class BillingAdjustmentController {
  constructor(
    private readonly paymentPostingService: PaymentPostingService,
  ) {}

  @ApiOperation({ summary: 'Get adjustments by claim' })
  @Get('by-claim/:claimId')
  async byClaim(
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const data = await this.paymentPostingService.listAdjustmentsByClaim(
      claimId,
      orgId,
    );
    return { message: 'Adjustments retrieved', data };
  }

  @ApiOperation({ summary: 'Get adjustments by payment post' })
  @Get('by-payment-post/:paymentPostId')
  async byPaymentPost(
    @Param('paymentPostId', ParseUUIDPipe) paymentPostId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.paymentPostingService.listAdjustmentsByPaymentPost(
      paymentPostId,
      orgId,
    );
    return { message: 'Adjustments retrieved', data: result.payload };
  }
}
