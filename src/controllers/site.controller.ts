import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SiteService } from '@services/site.service';
import { CreateSiteDto } from '@dtos/create-site.dto';
import { UpdateSiteDto } from '@dtos/update-site.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';

@ApiTags('Admin — Sites')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('admin/sites')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @ApiOperation({ summary: 'List all sites in the organization' })
  @Get()
  async list(
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.siteService.list(orgId, pagination);
    return {
      message: 'Sites retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'List sites by program' })
  @Get('by-program/:programId')
  async listByProgram(
    @Param('programId', ParseUUIDPipe) programId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.siteService.listByProgram(
      programId,
      orgId,
      pagination,
    );
    return {
      message: 'Sites retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Create a new site' })
  @Post()
  async create(
    @Body() dto: CreateSiteDto,
    @CurrentUser('org_id') orgId: string,
  ) {
    const site = await this.siteService.create(dto, orgId);
    return {
      message: 'Site created',
      data: site,
    };
  }

  @ApiOperation({ summary: 'Get a site by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const site = await this.siteService.findById(id, orgId);
    return {
      message: 'Site retrieved',
      data: site,
    };
  }

  @ApiOperation({ summary: 'Update a site' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateSiteDto,
  ) {
    const site = await this.siteService.update(id, orgId, dto);
    return {
      message: 'Site updated',
      data: site,
    };
  }
}
