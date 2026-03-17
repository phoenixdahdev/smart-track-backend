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
import { PortalIspQueryDto } from '@dtos/portal-isp-query.dto';
import { PaginationValidator } from '@utils/pagination-utils';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Guardian Portal — ISP')
@ApiBearerAuth()
@Roles(AgencyRole.GUARDIAN)
@Controller('portal/individuals/:individualId/isp')
export class PortalIspController {
  constructor(
    private readonly guardianPortalService: GuardianPortalService,
  ) {}

  @ApiOperation({ summary: 'List ISP goals (redacted)' })
  @Get('goals')
  async listGoals(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: PortalIspQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.guardianPortalService.getIspGoals(
      currentUser.id, individualId, orgId, query,
    );
    return { message: 'ISP goals retrieved', data: result.payload, meta: result.paginationMeta };
  }

  @ApiOperation({ summary: 'Get ISP goal progress data points (redacted)' })
  @Get('goals/:goalId/progress')
  async goalProgress(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() pagination: PaginationValidator,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.guardianPortalService.getIspGoalProgress(
      currentUser.id, individualId, goalId, orgId, pagination,
    );
    return { message: 'Goal progress retrieved', data: result.payload, meta: result.paginationMeta };
  }
}
