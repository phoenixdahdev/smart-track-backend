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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationService } from '@services/notification.service';
import { NotificationPreferenceService } from '@services/notification-preference.service';
import { NotificationQueryDto } from '@dtos/notification-query.dto';
import { MarkAllNotificationsReadDto } from '@dtos/mark-all-notifications-read.dto';
import { UpdateNotificationPreferenceDto } from '@dtos/update-notification-preference.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Guardian Portal — Notifications')
@ApiBearerAuth()
@Roles(AgencyRole.GUARDIAN)
@Controller('portal/notifications')
export class PortalNotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  @ApiOperation({ summary: 'List notifications' })
  @Get()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: NotificationQueryDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.notificationService.listByUser(
      currentUser.id, orgId, query, { type: query.type, read: query.read },
    );
    return { message: 'Notifications retrieved', data: result.payload, meta: result.paginationMeta };
  }

  @ApiOperation({ summary: 'Get unread count' })
  @Get('unread-count')
  async unreadCount(@CurrentUser() currentUser: AuthenticatedUser) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.notificationService.getUnreadCount(currentUser.id, orgId);
    return { message: 'Unread count retrieved', data: result };
  }

  @ApiOperation({ summary: 'Get notification preferences' })
  @Get('preferences')
  async getPreferences(@CurrentUser() currentUser: AuthenticatedUser) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const pref = await this.preferenceService.getOrCreate(currentUser.id, orgId);
    return { message: 'Preferences retrieved', data: pref };
  }

  @ApiOperation({ summary: 'Update notification preferences' })
  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const pref = await this.preferenceService.update(currentUser.id, orgId, dto);
    return { message: 'Preferences updated', data: pref };
  }

  @ApiOperation({ summary: 'Mark notification as read' })
  @Patch(':id/read')
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.notificationService.markRead(id, orgId, currentUser.id);
    return { message: 'Notification marked as read', data: result };
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Post('mark-all-read')
  async markAllRead(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: MarkAllNotificationsReadDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.notificationService.markAllRead(currentUser.id, orgId, dto.type);
    return { message: 'Notifications marked as read', data: result };
  }
}
