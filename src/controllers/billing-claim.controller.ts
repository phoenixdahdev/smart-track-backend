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
import { ClaimService } from '@services/claim.service';
import { ClaimMappingService } from '@services/claim-mapping.service';
import { ClaimValidationService } from '@services/claim-validation.service';
import { DenialHandlerService } from '@services/denial-handler.service';
import { GenerateClaimsDto } from '@dtos/generate-claims.dto';
import { UpdateClaimDto } from '@dtos/update-claim.dto';
import { TransitionClaimStatusDto } from '@dtos/transition-claim-status.dto';
import { VoidClaimDto } from '@dtos/void-claim.dto';
import { ClaimQueryDto } from '@dtos/claim-query.dto';
import { AppealClaimDto } from '@dtos/appeal-claim.dto';
import { WriteOffClaimDto } from '@dtos/write-off-claim.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Billing — Claims')
@ApiBearerAuth()
@Roles(AgencyRole.BILLING_SPECIALIST, AgencyRole.FINANCE_MANAGER)
@Controller('billing/claims')
export class BillingClaimController {
  constructor(
    private readonly claimService: ClaimService,
    private readonly claimMappingService: ClaimMappingService,
    private readonly claimValidationService: ClaimValidationService,
    private readonly denialHandlerService: DenialHandlerService,
  ) {}

  @ApiOperation({ summary: 'Generate claims from approved service records' })
  @Post('generate')
  async generate(
    @Body() dto: GenerateClaimsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const claim = await this.claimMappingService.mapServiceRecordsToClaim(
      dto.service_record_ids,
      orgId,
      currentUser.id,
    );
    return { message: 'Claim generated', data: claim };
  }

  @ApiOperation({ summary: 'List claims' })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ClaimQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.claimService.list(orgId, query, {
      status: query.status,
      individual_id: query.individual_id,
    });
    return {
      message: 'Claims retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'List denied claims' })
  @Get('denied')
  async denied(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ClaimQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.claimService.getDeniedClaims(orgId, query);
    return {
      message: 'Denied claims retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get claim by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const claim = await this.claimService.findById(id, orgId);
    return { message: 'Claim retrieved', data: claim };
  }

  @ApiOperation({ summary: 'Update a DRAFT claim' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClaimDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const claim = await this.claimService.updateDraft(
      id,
      orgId,
      dto,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Claim updated', data: claim };
  }

  @ApiOperation({ summary: 'Validate a claim' })
  @Post(':id/validate')
  async validate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.claimValidationService.validateAndStore(id, orgId);
    return { message: 'Claim validated', data: result };
  }

  @ApiOperation({ summary: 'Submit a claim' })
  @Post(':id/submit')
  async submit(
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

    const claim = await this.claimService.transitionStatus(
      id,
      orgId,
      'SUBMITTED' as never,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Claim submitted', data: claim };
  }

  @ApiOperation({ summary: 'Transition claim status' })
  @Post(':id/status')
  async transitionStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionClaimStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const claim = await this.claimService.transitionStatus(
      id,
      orgId,
      dto.status,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
      dto.reason,
    );
    return { message: 'Claim status updated', data: claim };
  }

  @ApiOperation({ summary: 'Void a claim' })
  @Post(':id/void')
  async voidClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidClaimDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const claim = await this.claimService.voidClaim(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      dto.reason,
      ip,
      userAgent,
    );
    return { message: 'Claim voided', data: claim };
  }

  @ApiOperation({ summary: 'Create replacement claim' })
  @Post(':id/replace')
  async replace(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const claim = await this.claimService.createReplacementClaim(
      id,
      orgId,
      currentUser.id,
    );
    return { message: 'Replacement claim created', data: claim };
  }

  @ApiOperation({ summary: 'Get claim status history' })
  @Get(':id/history')
  async history(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.claimService.getStatusHistory(id, orgId);
    return {
      message: 'Status history retrieved',
      data: result.payload,
    };
  }

  @ApiOperation({ summary: 'Appeal a denied claim' })
  @Post(':id/appeal')
  async appeal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AppealClaimDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const claim = await this.denialHandlerService.appeal(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      dto.reason,
      ip,
      userAgent,
    );
    return { message: 'Claim appealed', data: claim };
  }

  @ApiOperation({ summary: 'Write off a claim' })
  @Post(':id/write-off')
  async writeOff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WriteOffClaimDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const claim = await this.denialHandlerService.writeOff(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      dto.reason,
      ip,
      userAgent,
    );
    return { message: 'Claim written off', data: claim };
  }

  @ApiOperation({ summary: 'Correct and resubmit a denied claim' })
  @Post(':id/correct-and-resubmit')
  async correctAndResubmit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const claim = await this.denialHandlerService.correctAndResubmit(
      id,
      orgId,
      currentUser.id,
    );
    return { message: 'Replacement claim created', data: claim };
  }
}
