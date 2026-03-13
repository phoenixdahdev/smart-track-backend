import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClaimLineService } from '@services/claim-line.service';
import { CreateClaimLineDto } from '@dtos/create-claim-line.dto';
import { UpdateClaimLineDto } from '@dtos/update-claim-line.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Billing — Claim Lines')
@ApiBearerAuth()
@Roles(AgencyRole.BILLING_SPECIALIST, AgencyRole.FINANCE_MANAGER)
@Controller('billing/claims/:claimId/lines')
export class BillingClaimLineController {
  constructor(private readonly claimLineService: ClaimLineService) {}

  @ApiOperation({ summary: 'List lines for a claim' })
  @Get()
  async list(
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.claimLineService.findByClaimId(claimId, orgId);
    return { message: 'Claim lines retrieved', data: result.payload };
  }

  @ApiOperation({ summary: 'Add a line to a claim' })
  @Post()
  async addLine(
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @Body() dto: CreateClaimLineDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const line = await this.claimLineService.addLine(
      claimId,
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Claim line added', data: line };
  }

  @ApiOperation({ summary: 'Update a claim line' })
  @Patch(':lineId')
  async updateLine(
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Body() dto: UpdateClaimLineDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const line = await this.claimLineService.updateLine(
      claimId,
      lineId,
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Claim line updated', data: line };
  }

  @ApiOperation({ summary: 'Remove a claim line' })
  @Delete(':lineId')
  async removeLine(
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    await this.claimLineService.removeLine(
      claimId,
      lineId,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Claim line removed' };
  }
}
