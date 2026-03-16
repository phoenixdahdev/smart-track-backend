import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { EmailService } from './email.service';
import { UserDal } from '@dals/user.dal';
import {
  type NotificationDispatchParams,
  type BulkNotificationDispatchParams,
} from '@app-types/notification.types';
import { type AgencyRole } from '@enums/role.enum';

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly preferenceService: NotificationPreferenceService,
    private readonly emailService: EmailService,
    private readonly userDal: UserDal,
  ) {}

  async dispatch(params: NotificationDispatchParams): Promise<void> {
    try {
      // Check in-app preference
      const shouldInApp = await this.preferenceService.shouldNotify(
        params.userId,
        params.orgId,
        params.type,
        'in_app',
      );

      if (shouldInApp) {
        await this.notificationService.create({
          orgId: params.orgId,
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          entityType: params.entityType,
          entityId: params.entityId,
        });
      }

      // Check email preference
      const shouldEmail = await this.preferenceService.shouldNotify(
        params.userId,
        params.orgId,
        params.type,
        'email',
      );

      if (shouldEmail) {
        const user = await this.userDal.get({
          identifierOptions: { id: params.userId } as never,
        });

        if (user?.email) {
          await this.emailService.sendNotification(
            user.email,
            user.name ?? 'User',
            params.title,
            params.message,
          );
        }
      }

      // SMS stub — check preference but no-op for V1
      // const shouldSms = await this.preferenceService.shouldNotify(
      //   params.userId, params.orgId, params.type, 'sms',
      // );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Notification dispatch failed: ${msg}`);
    }
  }

  async dispatchBulk(params: BulkNotificationDispatchParams): Promise<void> {
    for (const userId of params.userIds) {
      await this.dispatch({
        orgId: params.orgId,
        userId,
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId,
        title: params.title,
        message: params.message,
      });
    }
  }

  async dispatchToRole(
    orgId: string,
    role: AgencyRole,
    type: NotificationDispatchParams['type'],
    title: string,
    message: string,
    entityType?: string,
    entityId?: string,
  ): Promise<void> {
    try {
      const users = await this.userDal.find({
        findOptions: { org_id: orgId, role } as never,
        transactionOptions: { useTransaction: false },
      });

      const userIds = users.payload.map(
        (u: { id: string }) => u.id,
      );

      if (userIds.length > 0) {
        await this.dispatchBulk({
          orgId,
          userIds,
          type,
          title,
          message,
          entityType,
          entityId,
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Dispatch to role ${role} failed: ${msg}`);
    }
  }
}
