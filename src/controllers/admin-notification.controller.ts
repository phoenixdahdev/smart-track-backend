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
import { NotificationTriggerService } from '@services/notification-trigger.service';
import { NotificationDispatchService } from '@services/notification-dispatch.service';
import { NotificationQueryDto } from '@dtos/notification-query.dto';
import { MarkAllNotificationsReadDto } from '@dtos/mark-all-notifications-read.dto';
import { UpdateNotificationPreferenceDto } from '@dtos/update-notification-preference.dto';
import { CreateNotificationDto } from '@dtos/create-notification.dto';
import { TriggerAuthThresholdCheckDto } from '@dtos/trigger-auth-threshold-check.dto';
import { TriggerReviewReminderDto } from '@dtos/trigger-review-reminder.dto';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('Admin — Notifications')
@ApiBearerAuth()
@Roles(AgencyRole.ADMIN, AgencyRole.AGENCY_OWNER)
@Controller('admin/notifications')
export class AdminNotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly preferenceService: NotificationPreferenceService,
    private readonly triggerService: NotificationTriggerService,
    private readonly dispatchService: NotificationDispatchService,
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
      currentUser.id,
      orgId,
      query,
      { type: query.type, read: query.read },
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

  @ApiOperation({ summary: 'Create a system notification (admin-only)' })
  @Post('create')
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateNotificationDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    await this.dispatchService.dispatch({
      orgId,
      userId: dto.user_id,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      entityType: dto.entity_type,
      entityId: dto.entity_id,
    });
    return { message: 'Notification created' };
  }

  @ApiOperation({ summary: 'Trigger auth threshold check' })
  @Post('trigger/auth-thresholds')
  async triggerAuthThresholds(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: TriggerAuthThresholdCheckDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    if (dto.authorization_id) {
      await this.triggerService.onAuthUtilizationChanged(orgId, dto.authorization_id);
      const expiring = await this.triggerService.checkExpiringAuthorizations(orgId);
      return { message: 'Auth threshold check completed', data: { checked: 1, expiring } };
    }

    const thresholds = await this.triggerService.checkAllAuthThresholds(orgId);
    const expiring = await this.triggerService.checkExpiringAuthorizations(orgId);
    return { message: 'Auth threshold check completed', data: { thresholds, expiring } };
  }

  @ApiOperation({ summary: 'Trigger review reminder check' })
  @Post('trigger/review-reminders')
  async triggerReviewReminders(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: TriggerReviewReminderDto,
  ) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.triggerService.checkOverdueReviews(orgId, dto.overdue_hours);
    return { message: 'Review reminder check completed', data: result };
  }

  @ApiOperation({ summary: 'Delete old read notifications' })
  @Post('cleanup')
  async cleanup(@CurrentUser() currentUser: AuthenticatedUser) {
    const orgId = currentUser.org_id;
    if (!orgId) throw new BadRequestException('User is not associated with an organization');

    const result = await this.notificationService.deleteOld(orgId, 90);
    return { message: 'Old notifications cleaned up', data: result };
  }
}
