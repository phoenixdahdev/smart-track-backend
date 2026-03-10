import {
  BadRequestException,
  Body,
  Controller,
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
import { IndividualService } from '@services/individual.service';
import { CreateIndividualDto } from '@dtos/create-individual.dto';
import { UpdateIndividualDto } from '@dtos/update-individual.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Admin — Individuals')
@ApiBearerAuth()
@Roles(
  AgencyRole.AGENCY_OWNER,
  AgencyRole.ADMIN,
  AgencyRole.SUPERVISOR,
  AgencyRole.CLINICIAN,
)
@Controller('admin/individuals')
export class IndividualController {
  constructor(private readonly individualService: IndividualService) {}

  @ApiOperation({ summary: 'List all individuals in the organization' })
  @Get()
  async list(
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.individualService.list(orgId, pagination);
    return {
      message: 'Individuals retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Create a new individual record' })
  @Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
  @Post()
  async create(
    @Body() dto: CreateIndividualDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const individual = await this.individualService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Individual created',
      data: individual,
    };
  }

  @ApiOperation({ summary: 'Get an individual by ID' })
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

    const individual = await this.individualService.findById(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Individual retrieved',
      data: individual,
    };
  }

  @ApiOperation({ summary: 'Update an individual record' })
  @Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateIndividualDto,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const individual = await this.individualService.update(
      id,
      orgId,
      dto,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Individual updated',
      data: individual,
    };
  }
}
