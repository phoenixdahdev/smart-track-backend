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
import { EvvCorrectionService } from '@services/evv-correction.service';
import { ReviewEvvCorrectionDto } from '@dtos/review-evv-correction.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Supervisor — EVV Corrections')
@ApiBearerAuth()
@Roles(AgencyRole.SUPERVISOR, AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('supervisor/evv-corrections')
export class SupervisorEvvCorrectionController {
  constructor(
    private readonly evvCorrectionService: EvvCorrectionService,
  ) {}

  @ApiOperation({ summary: 'List pending EVV corrections' })
  @Get('pending')
  async listPending(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() pagination: PaginationValidator,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.evvCorrectionService.listPending(
      orgId,
      pagination,
    );
    return {
      message: 'Pending EVV corrections retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get an EVV correction by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const correction = await this.evvCorrectionService.findById(id, orgId);
    return { message: 'EVV correction retrieved', data: correction };
  }

  @ApiOperation({ summary: 'Approve an EVV correction' })
  @Patch(':id/approve')
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewEvvCorrectionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const result = await this.evvCorrectionService.approve(
      id,
      orgId,
      currentUser.id,
      dto.reviewer_notes,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'EVV correction approved', data: result };
  }

  @ApiOperation({ summary: 'Reject an EVV correction' })
  @Patch(':id/reject')
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewEvvCorrectionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const result = await this.evvCorrectionService.reject(
      id,
      orgId,
      currentUser.id,
      dto.reviewer_notes,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'EVV correction rejected', data: result };
  }
}
