import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdlEntryService } from '@services/adl-entry.service';
import { AdlEntryQueryDto } from '@dtos/adl-entry-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';

@ApiTags('Clinical — ADL Entries')
@ApiBearerAuth()
@Roles(AgencyRole.CLINICIAN)
@Controller('clinical/adl-entries')
export class ClinicalAdlEntryController {
  constructor(private readonly adlEntryService: AdlEntryService) {}

  @ApiOperation({ summary: 'View ADL trends for an individual' })
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

  @ApiOperation({ summary: 'Get latest assistance level per category for an individual' })
  @Get('individual/:individualId/summary')
  async summary(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const summary = await this.adlEntryService.getAdlSummary(
      individualId,
      orgId,
    );
    return { message: 'ADL summary retrieved', data: summary };
  }
}
