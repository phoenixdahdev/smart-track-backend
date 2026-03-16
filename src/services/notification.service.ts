import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationDal } from '@dals/notification.dal';
import { AuditLogService } from './audit-log.service';
import { type NotificationType } from '@enums/notification-type.enum';
import { type PaginationValidator } from '@utils/pagination-utils';
import { LessThan } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationDal: NotificationDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(params: {
    orgId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }) {
    return this.notificationDal.create({
      createPayload: {
        org_id: params.orgId,
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        entity_type: params.entityType ?? null,
        entity_id: params.entityId ?? null,
        read: false,
        read_at: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async createBulk(params: {
    orgId: string;
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }) {
    const notifications: Awaited<ReturnType<typeof this.create>>[] = [];
    for (const userId of params.userIds) {
      const notification = await this.create({
        orgId: params.orgId,
        userId,
        type: params.type,
        title: params.title,
        message: params.message,
        entityType: params.entityType,
        entityId: params.entityId,
      });
      notifications.push(notification);
    }
    return notifications;
  }

  async findById(id: string, orgId: string) {
    const notification = await this.notificationDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!notification) {
      throw new NotFoundException();
    }

    return notification;
  }

  async listByUser(
    userId: string,
    orgId: string,
    pagination?: PaginationValidator,
    filters?: { type?: NotificationType; read?: boolean },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {
      user_id: userId,
      org_id: orgId,
    };
    if (filters?.type) findOptions.type = filters.type;
    if (filters?.read !== undefined) findOptions.read = filters.read;

    return this.notificationDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async markRead(id: string, orgId: string, userId: string) {
    const notification = await this.findById(id, orgId);

    if (notification.user_id !== userId) {
      throw new NotFoundException();
    }

    return this.notificationDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: { read: true, read_at: new Date() } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async markAllRead(userId: string, orgId: string, type?: NotificationType) {
    const findOptions: Record<string, unknown> = {
      user_id: userId,
      org_id: orgId,
      read: false,
    };
    if (type) findOptions.type = type;

    const unread = await this.notificationDal.find({
      findOptions: findOptions as never,
      transactionOptions: { useTransaction: false },
    });

    const now = new Date();
    for (const notification of unread.payload) {
      await this.notificationDal.update({
        identifierOptions: { id: notification.id } as never,
        updatePayload: { read: true, read_at: now } as never,
        transactionOptions: { useTransaction: false },
      });
    }

    return { updated: unread.payload.length };
  }

  async getUnreadCount(userId: string, orgId: string) {
    const result = await this.notificationDal.find({
      findOptions: { user_id: userId, org_id: orgId, read: false } as never,
      transactionOptions: { useTransaction: false },
    });

    return { count: result.payload.length };
  }

  async deleteOld(orgId: string, olderThanDays: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const old = await this.notificationDal.find({
      findOptions: {
        org_id: orgId,
        read: true,
        created_at: LessThan(cutoff),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    let deleted = 0;
    for (const notification of old.payload) {
      await this.notificationDal.delete({
        identifierOptions: { id: notification.id } as never,
        transactionOptions: { useTransaction: false },
      });
      deleted++;
    }

    return { deleted };
  }
}
