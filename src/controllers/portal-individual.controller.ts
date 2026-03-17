import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GuardianPortalService } from '@services/guardian-portal.service';
import { GuardianIndividualQueryDto } from '@dtos/guardian-individual-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { type Request } from 'express';

@ApiTags('Guardian Portal — Individuals')
@ApiBearerAuth()
@Roles(AgencyRole.GUARDIAN)
@Controller('portal/individuals')
export class PortalIndividualController {
  constructor(
    private readonly guardianPortalService: GuardianPortalService,
  ) {}

  @ApiOperation({ summary: 'List linked individuals' })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: GuardianIndividualQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.guardianPortalService.getLinkedIndividuals(
      currentUser.id, orgId, query, query.active_only,
    );
    return { message: 'Linked individuals retrieved', data: result.payload, meta: result.paginationMeta };
  }

  @ApiOperation({ summary: 'Get individual profile (redacted)' })
  @Get(':individualId')
  async getProfile(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const profile = await this.guardianPortalService.getIndividualProfile(
      currentUser.id, individualId, orgId, {
        userId: currentUser.id,
        userRole: 'GUARDIAN',
        ip: (req.ip ?? req.socket?.remoteAddress) as string,
        userAgent: req.headers['user-agent'] ?? '',
      },
    );
    return { message: 'Individual profile retrieved', data: profile };
  }

  @ApiOperation({ summary: 'Get individual dashboard summary' })
  @Get(':individualId/dashboard')
  async dashboard(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const data = await this.guardianPortalService.getDashboard(
      currentUser.id, individualId, orgId,
    );
    return { message: 'Dashboard retrieved', data };
  }
}
