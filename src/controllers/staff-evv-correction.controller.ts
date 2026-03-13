import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EvvCorrectionService } from '@services/evv-correction.service';
import { CreateEvvCorrectionDto } from '@dtos/create-evv-correction.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { PaginationValidator } from '@utils/pagination-utils';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Staff — EVV Corrections')
@ApiBearerAuth()
@Roles(AgencyRole.DSP)
@Controller('staff/evv-corrections')
export class StaffEvvCorrectionController {
  constructor(
    private readonly evvCorrectionService: EvvCorrectionService,
  ) {}

  @ApiOperation({ summary: 'Create an EVV correction request' })
  @Post()
  async create(
    @Body() dto: CreateEvvCorrectionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const correction = await this.evvCorrectionService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'EVV correction request created', data: correction };
  }

  @ApiOperation({ summary: 'List my EVV correction requests' })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() pagination: PaginationValidator,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const result = await this.evvCorrectionService.listByStaff(
      currentUser.id,
      orgId,
      pagination,
    );
    return {
      message: 'EVV corrections retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }

  @ApiOperation({ summary: 'Get an EVV correction request by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const correction = await this.evvCorrectionService.findById(id, orgId);
    return { message: 'EVV correction retrieved', data: correction };
  }
}
