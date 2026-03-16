import { type NotificationType } from '@enums/notification-type.enum';

export interface NotificationDispatchParams {
  orgId: string;
  userId: string;
  type: NotificationType;
  entityType?: string;
  entityId?: string;
  title: string;
  message: string;
}

export interface BulkNotificationDispatchParams {
  orgId: string;
  userIds: string[];
  type: NotificationType;
  entityType?: string;
  entityId?: string;
  title: string;
  message: string;
}

export type AuthThresholdAlertType =
  | 'NEAR_LIMIT_80'
  | 'NEAR_LIMIT_95'
  | 'EXCEEDED'
  | 'EXPIRING_30'
  | 'EXPIRING_7'
  | 'EXPIRING_TODAY'
  | 'EXPIRED'
  | 'NO_ACTIVE_AUTH';
