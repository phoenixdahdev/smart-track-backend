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
import { PortalIncidentQueryDto } from '@dtos/portal-incident-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Guardian Portal — Incidents')
@ApiBearerAuth()
@Roles(AgencyRole.GUARDIAN)
@Controller('portal/individuals/:individualId/incidents')
export class PortalIncidentController {
  constructor(
    private readonly guardianPortalService: GuardianPortalService,
  ) {}

  @ApiOperation({ summary: 'List incident summaries (redacted)' })
  @Get()
  async list(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: PortalIncidentQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.guardianPortalService.getIncidentSummaries(
      currentUser.id, individualId, orgId, query,
    );
    return { message: 'Incidents retrieved', data: result.payload, meta: result.paginationMeta };
  }
}
