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
import { PortalServiceRecordQueryDto } from '@dtos/portal-service-record-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Guardian Portal — Service Records')
@ApiBearerAuth()
@Roles(AgencyRole.GUARDIAN)
@Controller('portal/individuals/:individualId/service-records')
export class PortalServiceRecordController {
  constructor(
    private readonly guardianPortalService: GuardianPortalService,
  ) {}

  @ApiOperation({ summary: 'List service record summaries (redacted)' })
  @Get()
  async list(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: PortalServiceRecordQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.guardianPortalService.getServiceRecordSummaries(
      currentUser.id, individualId, orgId, query,
    );
    return { message: 'Service records retrieved', data: result.payload, meta: result.paginationMeta };
  }
}
