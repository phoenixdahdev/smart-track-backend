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
import { PaymentPostingService } from '@services/payment-posting.service';
import { PaymentMatchingService } from '@services/payment-matching.service';
import { PaymentPostQueryDto } from '@dtos/payment-post-query.dto';
import { ManualMatchDto } from '@dtos/manual-match.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Billing — Payment Posts')
@ApiBearerAuth()
@Roles(AgencyRole.BILLING_SPECIALIST, AgencyRole.FINANCE_MANAGER)
@Controller('billing/payment-posts')
export class BillingPaymentPostController {
  constructor(
    private readonly paymentPostingService: PaymentPostingService,
    private readonly paymentMatchingService: PaymentMatchingService,
  ) {}

  @ApiOperation({ summary: 'List payment posts' })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: PaymentPostQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.paymentPostingService.listPaymentPosts(orgId, query, {
      remittance_id: query.remittance_id,
      claim_id: query.claim_id,
      unmatched_only: query.unmatched_only,
    });
    return {
      message: 'Payment posts retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'List unmatched payment posts' })
  @Get('unmatched')
  async listUnmatched(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: PaymentPostQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.paymentMatchingService.listUnmatched(orgId, query);
    return {
      message: 'Unmatched payment posts retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get payment post by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const post = await this.paymentPostingService.findPaymentPostById(id, orgId);
    return { message: 'Payment post retrieved', data: post };
  }

  @ApiOperation({ summary: 'Manually match a payment post to a claim' })
  @Post(':id/match')
  async match(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManualMatchDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const result = await this.paymentMatchingService.manualMatch(
      id,
      dto.claim_id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Payment post matched', data: result };
  }

  @ApiOperation({ summary: 'Unmatch a payment post from its claim' })
  @Post(':id/unmatch')
  async unmatch(
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

    const result = await this.paymentMatchingService.unmatch(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Payment post unmatched', data: result };
  }

  @ApiOperation({ summary: 'Post payment to matched claim' })
  @Post(':id/post')
  async postPayment(
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

    const result = await this.paymentPostingService.postPayment(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Payment posted', data: result };
  }
}
