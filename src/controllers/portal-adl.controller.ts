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
import { PaginationValidator } from '@utils/pagination-utils';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Guardian Portal — ADL')
@ApiBearerAuth()
@Roles(AgencyRole.GUARDIAN)
@Controller('portal/individuals/:individualId/adl')
export class PortalAdlController {
  constructor(
    private readonly guardianPortalService: GuardianPortalService,
  ) {}

  @ApiOperation({ summary: 'List ADL summaries (redacted)' })
  @Get()
  async list(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() pagination: PaginationValidator,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.guardianPortalService.getAdlSummaries(
      currentUser.id, individualId, orgId, pagination,
    );
    return { message: 'ADL summaries retrieved', data: result.payload, meta: result.paginationMeta };
  }
}
