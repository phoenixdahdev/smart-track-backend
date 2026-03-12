import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CorrectionRequestService } from '@services/correction-request.service';
import { CreateCorrectionRequestDto } from '@dtos/create-correction-request.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Staff — Correction Requests')
@ApiBearerAuth()
@Roles(AgencyRole.DSP)
@Controller('staff/correction-requests')
export class StaffCorrectionRequestController {
  constructor(
    private readonly correctionRequestService: CorrectionRequestService,
  ) {}

  @ApiOperation({ summary: 'Create a correction request for an approved service record' })
  @Post()
  async create(
    @Body() dto: CreateCorrectionRequestDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const userAgent = req.headers['user-agent'] ?? '';

    const request = await this.correctionRequestService.create(
      dto,
      orgId,
      currentUser.id,
      currentUser.role,
      ip,
      userAgent,
    );
    return { message: 'Correction request created', data: request };
  }

  @ApiOperation({ summary: 'List correction requests by service record' })
  @Get('by-service-record/:serviceRecordId')
  async listByServiceRecord(
    @Param('serviceRecordId', ParseUUIDPipe) serviceRecordId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const result = await this.correctionRequestService.listByServiceRecord(
      serviceRecordId,
      orgId,
    );
    return {
      message: 'Correction requests retrieved',
      data: result.payload,
    };
  }

  @ApiOperation({ summary: 'Get a correction request by ID' })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const request = await this.correctionRequestService.findById(id, orgId);
    return { message: 'Correction request retrieved', data: request };
  }
}
