import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdlEntryService } from '@services/adl-entry.service';
import { AdlEntryQueryDto } from '@dtos/adl-entry-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Supervisor — ADL Entries')
@ApiBearerAuth()
@Roles(AgencyRole.SUPERVISOR)
@Controller('supervisor/adl-entries')
export class SupervisorAdlEntryController {
  constructor(private readonly adlEntryService: AdlEntryService) {}

  @ApiOperation({ summary: 'View ADL entries for a service record during review' })
  @Get('service-record/:serviceRecordId')
  async listByServiceRecord(
    @Param('serviceRecordId', ParseUUIDPipe) serviceRecordId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.adlEntryService.findByServiceRecord(
      serviceRecordId,
      orgId,
    );
    return {
      message: 'ADL entries retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'View a single ADL entry' })
  @Get(':id')
  async findById(
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

    const entry = await this.adlEntryService.findById(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'ADL entry retrieved', data: entry };
  }

  @ApiOperation({ summary: 'View ADL history for an individual' })
  @Get('individual/:individualId')
  async listByIndividual(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @Query() query: AdlEntryQueryDto,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.adlEntryService.findByIndividual(
      { ...query, individual_id: individualId },
      orgId,
    );
    return {
      message: 'ADL entries retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }
}
