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
import { ProgramService } from '@services/program.service';
import { CreateProgramDto } from '@dtos/create-program.dto';
import { UpdateProgramDto } from '@dtos/update-program.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';

@ApiTags('Admin — Programs')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('admin/programs')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  @ApiOperation({ summary: 'List all programs in the organization' })
  @Get()
  async list(
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.programService.list(orgId, pagination);
    return {
      message: 'Programs retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Create a new program' })
  @Post()
  async create(
    @Body() dto: CreateProgramDto,
    @CurrentUser('org_id') orgId: string,
  ) {
    const program = await this.programService.create(dto, orgId);
    return {
      message: 'Program created',
      data: program,
    };
  }

  @ApiOperation({ summary: 'Get a program by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const program = await this.programService.findById(id, orgId);
    return {
      message: 'Program retrieved',
      data: program,
    };
  }

  @ApiOperation({ summary: 'Update a program' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateProgramDto,
  ) {
    const program = await this.programService.update(id, orgId, dto);
    return {
      message: 'Program updated',
      data: program,
    };
  }
}
