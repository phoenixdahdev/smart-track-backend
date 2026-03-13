import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IndividualPayerCoverageService } from '@services/individual-payer-coverage.service';
import { CreateIndividualPayerCoverageDto } from '@dtos/create-individual-payer-coverage.dto';
import { UpdateIndividualPayerCoverageDto } from '@dtos/update-individual-payer-coverage.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Admin — Individual Payer Coverages')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('admin/individual-payer-coverages')
export class AdminIndividualPayerCoverageController {
  constructor(
    private readonly coverageService: IndividualPayerCoverageService,
  ) {}

  @ApiOperation({ summary: 'Create an individual payer coverage' })
  @Post()
  async create(
    @Body() dto: CreateIndividualPayerCoverageDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const record = await this.coverageService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Coverage created', data: record };
  }

  @ApiOperation({ summary: 'List individual payer coverages' })
  @Get()
  async list(
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.coverageService.list(orgId, pagination);
    return {
      message: 'Coverages retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get coverage by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const record = await this.coverageService.findById(id, orgId);
    return { message: 'Coverage retrieved', data: record };
  }

  @ApiOperation({ summary: 'Update an individual payer coverage' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIndividualPayerCoverageDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const record = await this.coverageService.update(
      id,
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Coverage updated', data: record };
  }

  @ApiOperation({ summary: 'Deactivate an individual payer coverage' })
  @Delete(':id')
  async deactivate(
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

    const record = await this.coverageService.deactivate(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Coverage deactivated', data: record };
  }

  @ApiOperation({ summary: 'List coverages by individual' })
  @Get('by-individual/:individualId')
  async listByIndividual(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.coverageService.listByIndividual(
      individualId,
      orgId,
      pagination,
    );
    return {
      message: 'Coverages retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }
}
