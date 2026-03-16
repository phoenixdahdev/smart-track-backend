import {
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
import { BreakGlassService } from '@services/break-glass.service';
import { RequestBreakGlassDto } from '@dtos/request-break-glass.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { PlatformRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { PaginationValidator } from '@utils/pagination-utils';

@ApiTags('SuperAdmin — Break Glass')
@ApiBearerAuth()
@Roles(
  PlatformRole.PLATFORM_OWNER,
  PlatformRole.PLATFORM_ADMIN,
  PlatformRole.SUPPORT_ENGINEER,
)
@Controller('superadmin/break-glass')
export class SuperadminBreakGlassController {
  constructor(private readonly breakGlassService: BreakGlassService) {}

  @ApiOperation({ summary: 'Request break-glass session' })
  @Post()
  async request(
    @Body() dto: RequestBreakGlassDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const session = await this.breakGlassService.request(
      dto, currentUser.id, ip, ua,
    );
    return { message: 'Break-glass session requested', data: session };
  }

  @ApiOperation({ summary: 'Approve break-glass session' })
  @Post(':id/approve')
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const session = await this.breakGlassService.approve(
      id, currentUser.id, ip, ua,
    );
    return { message: 'Break-glass session approved', data: session };
  }

  @ApiOperation({ summary: 'End break-glass session' })
  @Post(':id/end')
  async end(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { actions_summary: string },
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const session = await this.breakGlassService.end(
      id, currentUser.id, body.actions_summary, ip, ua,
    );
    return { message: 'Break-glass session ended', data: session };
  }

  @ApiOperation({ summary: 'List break-glass sessions' })
  @Get()
  async list(@Query() query: PaginationValidator) {
    const result = await this.breakGlassService.list(query);
    return { message: 'Sessions retrieved', data: result.payload, meta: result.paginationMeta };
  }

  @ApiOperation({ summary: 'Get break-glass session by ID' })
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const session = await this.breakGlassService.findById(id);
    return { message: 'Session retrieved', data: session };
  }

  @ApiOperation({ summary: 'Get active break-glass sessions for org' })
  @Get('org/:orgId')
  async getActiveByOrg(@Param('orgId', ParseUUIDPipe) orgId: string) {
    const result = await this.breakGlassService.getActiveByOrg(orgId);
    return { message: 'Active sessions retrieved', data: result.payload };
  }
}
