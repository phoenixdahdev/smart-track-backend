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
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdlCategoryService } from '@services/adl-category.service';
import { CreateAdlCategoryDto } from '@dtos/create-adl-category.dto';
import { UpdateAdlCategoryDto } from '@dtos/update-adl-category.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { PrivateFields } from '@decorators/private.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Admin — ADL Categories')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@PrivateFields([])
@Controller('admin/adl-categories')
export class AdminAdlCategoryController {
  constructor(private readonly adlCategoryService: AdlCategoryService) {}

  @ApiOperation({ summary: 'Create a custom ADL category' })
  @Post()
  async create(
    @Body() dto: CreateAdlCategoryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const category = await this.adlCategoryService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'ADL category created', data: category };
  }

  @ApiOperation({ summary: 'List all active ADL categories' })
  @Get()
  async list(@CurrentUser('org_id') orgId: string) {
    const categories = await this.adlCategoryService.findAll(orgId);
    return { message: 'ADL categories retrieved', data: categories };
  }

  @ApiOperation({ summary: 'Get an ADL category by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const category = await this.adlCategoryService.findById(id, orgId);
    return { message: 'ADL category retrieved', data: category };
  }

  @ApiOperation({ summary: 'Update an ADL category' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdlCategoryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const category = await this.adlCategoryService.update(
      id,
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'ADL category updated', data: category };
  }

  @ApiOperation({ summary: 'Deactivate an ADL category' })
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

    const category = await this.adlCategoryService.deactivate(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'ADL category deactivated', data: category };
  }

  @ApiOperation({ summary: 'Seed standard ADL/IADL categories' })
  @Post('seed')
  async seed(@CurrentUser('org_id') orgId: string) {
    const categories = await this.adlCategoryService.seedStandardCategories(orgId);
    return {
      message: `${categories.length} standard categories seeded`,
      data: categories,
    };
  }
}
