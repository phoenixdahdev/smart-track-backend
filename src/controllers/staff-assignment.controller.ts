import {
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
import { StaffAssignmentService } from '@services/staff-assignment.service';
import { CreateStaffAssignmentDto } from '@dtos/create-staff-assignment.dto';
import { UpdateStaffAssignmentDto } from '@dtos/update-staff-assignment.dto';
import { EndAssignmentDto } from '@dtos/end-assignment.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Admin — Staff Assignments')
@ApiBearerAuth()
@Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN, AgencyRole.SUPERVISOR)
@Controller('admin/staff-assignments')
export class StaffAssignmentController {
  constructor(
    private readonly staffAssignmentService: StaffAssignmentService,
  ) {}

  @ApiOperation({ summary: 'List assignments for a specific individual' })
  @Get('by-individual/:individualId')
  async listByIndividual(
    @Param('individualId', ParseUUIDPipe) individualId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.staffAssignmentService.listByIndividual(
      individualId,
      orgId,
      pagination,
    );
    return {
      message: 'Staff assignments retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'List assignments for a specific staff member' })
  @Get('by-staff/:staffId')
  async listByStaff(
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() pagination: PaginationValidator,
  ) {
    const result = await this.staffAssignmentService.listByStaff(
      staffId,
      orgId,
      pagination,
    );
    return {
      message: 'Staff assignments retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Create a new staff assignment' })
  @Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
  @Post()
  async create(
    @Body() dto: CreateStaffAssignmentDto,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';
    const assignment = await this.staffAssignmentService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Staff assignment created',
      data: assignment,
    };
  }

  @ApiOperation({ summary: 'Get a staff assignment by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const assignment = await this.staffAssignmentService.findById(id, orgId);
    return {
      message: 'Staff assignment retrieved',
      data: assignment,
    };
  }

  @ApiOperation({ summary: 'Update a staff assignment (e.g. end date)' })
  @Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateStaffAssignmentDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';
    const assignment = await this.staffAssignmentService.update(
      id,
      orgId,
      dto,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Staff assignment updated',
      data: assignment,
    };
  }

  @ApiOperation({ summary: 'End a staff assignment' })
  @Roles(AgencyRole.AGENCY_OWNER, AgencyRole.ADMIN)
  @Patch(':id/end')
  async endAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: EndAssignmentDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';
    const assignment = await this.staffAssignmentService.endAssignment(
      id,
      orgId,
      dto.end_date,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return {
      message: 'Staff assignment ended',
      data: assignment,
    };
  }
}
