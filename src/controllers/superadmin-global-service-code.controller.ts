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
import { GlobalServiceCodeService } from '@services/global-service-code.service';
import { CreateGlobalServiceCodeDto } from '@dtos/create-global-service-code.dto';
import { UpdateGlobalServiceCodeDto } from '@dtos/update-global-service-code.dto';
import { GlobalServiceCodeQueryDto } from '@dtos/global-service-code-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { PlatformRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('SuperAdmin — Global Service Codes')
@ApiBearerAuth()
@Roles(PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_ADMIN)
@Controller('superadmin/platform/service-codes')
export class SuperadminGlobalServiceCodeController {
  constructor(private readonly codeService: GlobalServiceCodeService) {}

  @ApiOperation({ summary: 'Create global service code' })
  @Post()
  async create(
    @Body() dto: CreateGlobalServiceCodeDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const code = await this.codeService.create(dto, currentUser.id, ip, ua);
    return { message: 'Service code created', data: code };
  }

  @ApiOperation({ summary: 'List global service codes' })
  @Get()
  async list(@Query() query: GlobalServiceCodeQueryDto) {
    const result = await this.codeService.list(query, {
      code_type: query.code_type,
      status: query.status,
    });
    return { message: 'Service codes retrieved', data: result.payload, meta: result.paginationMeta };
  }

  @ApiOperation({ summary: 'Get global service code by ID' })
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const code = await this.codeService.findById(id);
    return { message: 'Service code retrieved', data: code };
  }

  @ApiOperation({ summary: 'Update global service code' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGlobalServiceCodeDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const code = await this.codeService.update(id, dto, currentUser.id, ip, ua);
    return { message: 'Service code updated', data: code };
  }

  @ApiOperation({ summary: 'Deprecate global service code' })
  @Post(':id/deprecate')
  async deprecate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const code = await this.codeService.deprecate(id, currentUser.id, ip, ua);
    return { message: 'Service code deprecated', data: code };
  }
}
