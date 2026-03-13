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
import { ClaimSubmissionService } from '@services/claim-submission.service';
import { SubmitBatchClaimsDto } from '@dtos/submit-claim.dto';
import { RecordClaimResponseDto } from '@dtos/record-claim-response.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Billing — Claim Submissions')
@ApiBearerAuth()
@Roles(AgencyRole.BILLING_SPECIALIST, AgencyRole.FINANCE_MANAGER)
@Controller('billing/claim-submissions')
export class BillingClaimSubmissionController {
  constructor(
    private readonly claimSubmissionService: ClaimSubmissionService,
  ) {}

  @ApiOperation({ summary: 'Submit a single claim' })
  @Post('submit')
  async submit(
    @Body('claim_id') claimId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const submission = await this.claimSubmissionService.submitClaim(
      claimId,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Claim submitted', data: submission };
  }

  @ApiOperation({ summary: 'Submit a batch of claims' })
  @Post('submit-batch')
  async submitBatch(
    @Body() dto: SubmitBatchClaimsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const submissions = await this.claimSubmissionService.submitBatch(
      dto.claim_ids,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Claims submitted', data: submissions };
  }

  @ApiOperation({ summary: 'List claim submissions' })
  @Get()
  async list(
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.claimSubmissionService.list(orgId, pagination);
    return {
      message: 'Claim submissions retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get submission by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const submission = await this.claimSubmissionService.findById(id, orgId);
    return { message: 'Submission retrieved', data: submission };
  }

  @ApiOperation({ summary: 'Record clearinghouse response for a submission' })
  @Post(':id/response')
  async recordResponse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordClaimResponseDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const submission = await this.claimSubmissionService.recordResponse(
      id,
      dto.response_status,
      dto.response_details,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Response recorded', data: submission };
  }
}
