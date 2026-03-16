import {
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
import { GlobalPayerService } from '@services/global-payer.service';
import { CreateGlobalPayerDto } from '@dtos/create-global-payer.dto';
import { UpdateGlobalPayerDto } from '@dtos/update-global-payer.dto';
import { GlobalPayerQueryDto } from '@dtos/global-payer-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { PlatformRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('SuperAdmin — Global Payers')
@ApiBearerAuth()
@Roles(PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_ADMIN)
@Controller('superadmin/platform/payers')
export class SuperadminGlobalPayerController {
  constructor(private readonly payerService: GlobalPayerService) {}

  @ApiOperation({ summary: 'Create global payer' })
  @Post()
  async create(
    @Body() dto: CreateGlobalPayerDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const payer = await this.payerService.create(dto, currentUser.id, ip, ua);
    return { message: 'Payer created', data: payer };
  }

  @ApiOperation({ summary: 'List global payers' })
  @Get()
  async list(@Query() query: GlobalPayerQueryDto) {
    const result = await this.payerService.list(query, {
      state: query.state,
      active: query.active,
    });
    return { message: 'Payers retrieved', data: result.payload, meta: result.paginationMeta };
  }

  @ApiOperation({ summary: 'Get global payer by ID' })
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const payer = await this.payerService.findById(id);
    return { message: 'Payer retrieved', data: payer };
  }

  @ApiOperation({ summary: 'Update global payer' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGlobalPayerDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const payer = await this.payerService.update(id, dto, currentUser.id, ip, ua);
    return { message: 'Payer updated', data: payer };
  }

  @ApiOperation({ summary: 'Deactivate global payer' })
  @Delete(':id')
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const payer = await this.payerService.deactivate(id, currentUser.id, ip, ua);
    return { message: 'Payer deactivated', data: payer };
  }
}
