import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GuardianPortalService } from '@services/guardian-portal.service';
import { PortalMarQueryDto } from '@dtos/portal-mar-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Guardian Portal — Medications')
@ApiBearerAuth()
@Roles(AgencyRole.GUARDIAN)
@Controller('portal/individuals/:individualId/medications')
export class PortalMarController {
  constructor(
    private readonly guardianPortalService: GuardianPortalService,
  ) {}

  @ApiOperation({ summary: 'List MAR summaries (redacted)' })
  @Get()
  async list(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: PortalMarQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.guardianPortalService.getMarSummaries(
      currentUser.id, individualId, orgId, query,
    );
    return { message: 'Medications retrieved', data: result.payload, meta: result.paginationMeta };
  }
}
