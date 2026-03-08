import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from '@services/user.service';
import { CreateUserDto } from '@dtos/create-user.dto';
import { UpdateUserDto } from '@dtos/update-user.dto';
import { AssignRoleDto } from '@dtos/assign-role.dto';
import { UpdateSubPermissionsDto } from '@dtos/update-sub-permissions.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Admin — Users')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
@Controller('admin/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'List all users in the organization' })
  @Get()
  async list(
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.userService.list(orgId, pagination);
    return {
      message: 'Users retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Invite a new user to the organization' })
  @Post()
  async invite(
    @Body() dto: CreateUserDto,
    @CurrentUser('org_id') orgId: string,
  ) {
    const user = await this.userService.invite(dto, orgId);
    return {
      message: 'User invited successfully',
      data: user,
    };
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const user = await this.userService.findById(id, orgId);
    return {
      message: 'User retrieved',
      data: user,
    };
  }

  @ApiOperation({ summary: 'Update user profile, role, or status' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    if (
      dto.role === AgencyRole.AGENCY_OWNER &&
      currentUser.role !== AgencyRole.AGENCY_OWNER
    ) {
      throw new ForbiddenException('Only the agency owner can assign this role');
    }
    const user = await this.userService.update(id, orgId, dto);
    return {
      message: 'User updated',
      data: user,
    };
  }

  @ApiOperation({ summary: 'Assign a role to a user' })
  @Patch(':id/role')
  async assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (id === currentUser.id) {
      throw new ForbiddenException('Cannot change your own role');
    }
    if (
      dto.role === AgencyRole.AGENCY_OWNER &&
      currentUser.role !== AgencyRole.AGENCY_OWNER
    ) {
      throw new ForbiddenException('Only the agency owner can assign this role');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';
    const user = await this.userService.assignRole(
      id,
      orgId,
      dto.role,
      currentUser.id,
      ip,
      userAgent,
    );
    return {
      message: 'Role assigned',
      data: user,
    };
  }

  @ApiOperation({ summary: 'Update sub-permissions for a user' })
  @Patch(':id/permissions')
  async updateSubPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateSubPermissionsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (id === currentUser.id) {
      throw new ForbiddenException('Cannot modify your own permissions');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';
    const user = await this.userService.updateSubPermissions(
      id,
      orgId,
      dto.sub_permissions,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Permissions updated',
      data: user,
    };
  }

  @ApiOperation({ summary: 'Deactivate (archive) a user' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';
    await this.userService.deactivate(
      id,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'User deactivated',
    };
  }
}
