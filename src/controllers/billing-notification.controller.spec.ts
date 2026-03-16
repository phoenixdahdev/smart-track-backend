import { BillingNotificationController } from './billing-notification.controller';
import { NotificationType } from '@enums/notification-type.enum';

describe('BillingNotificationController', () => {
  let controller: BillingNotificationController;
  let notificationService: {
    listByUser: jest.Mock;
    getUnreadCount: jest.Mock;
    markRead: jest.Mock;
    markAllRead: jest.Mock;
  };
  let preferenceService: { getOrCreate: jest.Mock; update: jest.Mock };
  let triggerService: {
    onAuthUtilizationChanged: jest.Mock;
    checkAllAuthThresholds: jest.Mock;
  };

  const mockCurrentUser = {
    id: 'billing-uuid',
    org_id: 'org-uuid',
    role: 'BILLING_SPECIALIST',
    email: 'billing@test.com',
    name: 'Billing User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  const mockNotification = {
    id: 'notif-uuid',
    type: NotificationType.CLAIM_STATUS,
    title: 'Claim update',
    message: 'Claim status changed',
    read: false,
  };

  beforeEach(() => {
    notificationService = {
      listByUser: jest.fn().mockResolvedValue({
        payload: [mockNotification],
        paginationMeta: { total: 1 },
      }),
      getUnreadCount: jest.fn().mockResolvedValue({ count: 2 }),
      markRead: jest.fn().mockResolvedValue({ ...mockNotification, read: true }),
      markAllRead: jest.fn().mockResolvedValue({ updated: 2 }),
    };

    preferenceService = {
      getOrCreate: jest.fn().mockResolvedValue({ email_enabled: true }),
      update: jest.fn().mockResolvedValue({ email_enabled: false }),
    };

    triggerService = {
      onAuthUtilizationChanged: jest.fn().mockResolvedValue(undefined),
      checkAllAuthThresholds: jest.fn().mockResolvedValue({ checked: 5, alerts: 1 }),
    };

    controller = new BillingNotificationController(
      notificationService as never,
      preferenceService as never,
      triggerService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /billing/notifications', () => {
    it('should list notifications', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);
      expect(result.message).toBe('Notifications retrieved');
    });
  });

  describe('GET /billing/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const result = await controller.unreadCount(mockCurrentUser as never);
      expect(result.data).toEqual({ count: 2 });
    });
  });

  describe('GET /billing/notifications/preferences', () => {
    it('should return preferences', async () => {
      const result = await controller.getPreferences(mockCurrentUser as never);
      expect(result.message).toBe('Preferences retrieved');
    });
  });

  describe('PATCH /billing/notifications/preferences', () => {
    it('should update preferences', async () => {
      const result = await controller.updatePreferences(
        mockCurrentUser as never, { email_enabled: false },
      );
      expect(result.message).toBe('Preferences updated');
    });
  });

  describe('PATCH /billing/notifications/:id/read', () => {
    it('should mark as read', async () => {
      const result = await controller.markRead('notif-uuid', mockCurrentUser as never);
      expect(result.message).toBe('Notification marked as read');
    });
  });

  describe('POST /billing/notifications/mark-all-read', () => {
    it('should mark all as read', async () => {
      const result = await controller.markAllRead(mockCurrentUser as never, {});
      expect(result.data).toEqual({ updated: 2 });
    });
  });

  describe('POST /billing/notifications/trigger/auth-thresholds', () => {
    it('should trigger all auth thresholds', async () => {
      const result = await controller.triggerAuthThresholds(mockCurrentUser as never, {});
      expect(result.message).toBe('Auth threshold check completed');
    });

    it('should trigger single auth threshold', async () => {
      await controller.triggerAuthThresholds(mockCurrentUser as never, {
        authorization_id: 'auth-uuid',
      });
      expect(triggerService.onAuthUtilizationChanged).toHaveBeenCalledWith('org-uuid', 'auth-uuid');
    });
  });
});
