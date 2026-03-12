import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CorrectionRequestService } from '@services/correction-request.service';
import { ReviewCorrectionRequestDto } from '@dtos/review-correction-request.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Supervisor — Correction Requests')
@ApiBearerAuth()
@Roles(AgencyRole.SUPERVISOR, AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('supervisor/correction-requests')
export class SupervisorCorrectionRequestController {
  constructor(
    private readonly correctionRequestService: CorrectionRequestService,
  ) {}

  @ApiOperation({ summary: 'Get pending correction requests' })
  @Get('pending')
  async listPending(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() pagination: PaginationValidator,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.correctionRequestService.listPending(
      orgId,
      pagination,
    );
    return {
      message: 'Pending correction requests retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get a correction request by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const request = await this.correctionRequestService.findById(id, orgId);
    return { message: 'Correction request retrieved', data: request };
  }

  @ApiOperation({ summary: 'Approve a correction request' })
  @Patch(':id/approve')
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewCorrectionRequestDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const request = await this.correctionRequestService.approve(
      id,
      orgId,
      currentUser.id,
      dto.reviewer_notes,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Correction request approved', data: request };
  }

  @ApiOperation({ summary: 'Reject a correction request' })
  @Patch(':id/reject')
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewCorrectionRequestDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const request = await this.correctionRequestService.reject(
      id,
      orgId,
      currentUser.id,
      dto.reviewer_notes,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Correction request rejected', data: request };
  }
}
