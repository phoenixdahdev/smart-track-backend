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
import { OperatorService } from '@services/operator.service';
import { CreateOperatorDto } from '@dtos/create-operator.dto';
import { UpdateOperatorDto } from '@dtos/update-operator.dto';
import { OperatorQueryDto } from '@dtos/operator-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { PlatformRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('SuperAdmin — Operators')
@ApiBearerAuth()
@Roles(PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_ADMIN)
@Controller('superadmin/operators')
export class SuperadminOperatorController {
  constructor(private readonly operatorService: OperatorService) {}

  @ApiOperation({ summary: 'Create operator' })
  @Post()
  async create(
    @Body() dto: CreateOperatorDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const operator = await this.operatorService.create(dto, currentUser.id, ip, ua);
    return { message: 'Operator created', data: operator };
  }

  @ApiOperation({ summary: 'List operators' })
  @Get()
  async list(@Query() query: OperatorQueryDto) {
    const result = await this.operatorService.list(query, {
      role: query.role,
      active: query.active,
    });
    return { message: 'Operators retrieved', data: result.payload, meta: result.paginationMeta };
  }

  @ApiOperation({ summary: 'Get operator by ID' })
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const operator = await this.operatorService.findById(id);
    return { message: 'Operator retrieved', data: operator };
  }

  @ApiOperation({ summary: 'Update operator' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOperatorDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const operator = await this.operatorService.update(id, dto, currentUser.id, ip, ua);
    return { message: 'Operator updated', data: operator };
  }

  @ApiOperation({ summary: 'Deactivate operator' })
  @Delete(':id')
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const operator = await this.operatorService.deactivate(id, currentUser.id, ip, ua);
    return { message: 'Operator deactivated', data: operator };
  }
}
