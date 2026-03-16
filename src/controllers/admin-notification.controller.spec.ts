import { AdminNotificationController } from './admin-notification.controller';
import { NotificationType } from '@enums/notification-type.enum';

describe('AdminNotificationController', () => {
  let controller: AdminNotificationController;
  let notificationService: {
    listByUser: jest.Mock;
    getUnreadCount: jest.Mock;
    markRead: jest.Mock;
    markAllRead: jest.Mock;
    deleteOld: jest.Mock;
  };
  let preferenceService: { getOrCreate: jest.Mock; update: jest.Mock };
  let triggerService: {
    onAuthUtilizationChanged: jest.Mock;
    checkAllAuthThresholds: jest.Mock;
    checkExpiringAuthorizations: jest.Mock;
    checkOverdueReviews: jest.Mock;
  };
  let dispatchService: { dispatch: jest.Mock };

  const mockCurrentUser = {
    id: 'admin-uuid',
    org_id: 'org-uuid',
    role: 'ADMIN',
    email: 'admin@test.com',
    name: 'Admin User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  const mockNotification = {
    id: 'notif-uuid',
    org_id: 'org-uuid',
    user_id: 'admin-uuid',
    type: NotificationType.SYSTEM,
    title: 'Test',
    message: 'Test message',
    read: false,
  };

  const mockPreference = {
    id: 'pref-uuid',
    email_enabled: true,
    sms_enabled: false,
    in_app_enabled: true,
    preferences: {},
  };

  beforeEach(() => {
    notificationService = {
      listByUser: jest.fn().mockResolvedValue({
        payload: [mockNotification],
        paginationMeta: { total: 1 },
      }),
      getUnreadCount: jest.fn().mockResolvedValue({ count: 1 }),
      markRead: jest.fn().mockResolvedValue({ ...mockNotification, read: true }),
      markAllRead: jest.fn().mockResolvedValue({ updated: 1 }),
      deleteOld: jest.fn().mockResolvedValue({ deleted: 5 }),
    };

    preferenceService = {
      getOrCreate: jest.fn().mockResolvedValue(mockPreference),
      update: jest.fn().mockResolvedValue(mockPreference),
    };

    triggerService = {
      onAuthUtilizationChanged: jest.fn().mockResolvedValue(undefined),
      checkAllAuthThresholds: jest.fn().mockResolvedValue({ checked: 10, alerts: 2 }),
      checkExpiringAuthorizations: jest.fn().mockResolvedValue({ checked: 10, alerts: 1 }),
      checkOverdueReviews: jest.fn().mockResolvedValue({ checked: 5, alerts: 1 }),
    };

    dispatchService = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    };

    controller = new AdminNotificationController(
      notificationService as never,
      preferenceService as never,
      triggerService as never,
      dispatchService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/notifications', () => {
    it('should list notifications', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);
      expect(result.message).toBe('Notifications retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /admin/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const result = await controller.unreadCount(mockCurrentUser as never);
      expect(result.data).toEqual({ count: 1 });
    });
  });

  describe('GET /admin/notifications/preferences', () => {
    it('should return preferences', async () => {
      const result = await controller.getPreferences(mockCurrentUser as never);
      expect(result.data).toEqual(mockPreference);
    });
  });

  describe('PATCH /admin/notifications/preferences', () => {
    it('should update preferences', async () => {
      const result = await controller.updatePreferences(
        mockCurrentUser as never,
        { email_enabled: false },
      );
      expect(result.message).toBe('Preferences updated');
    });
  });

  describe('PATCH /admin/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const result = await controller.markRead('notif-uuid', mockCurrentUser as never);
      expect(result.message).toBe('Notification marked as read');
    });
  });

  describe('POST /admin/notifications/mark-all-read', () => {
    it('should mark all as read', async () => {
      const result = await controller.markAllRead(mockCurrentUser as never, {});
      expect(result.data).toEqual({ updated: 1 });
    });
  });

  describe('POST /admin/notifications/create', () => {
    it('should create a notification', async () => {
      const dto = {
        user_id: 'user-uuid',
        type: NotificationType.SYSTEM,
        title: 'System notification',
        message: 'Test message',
      };
      const result = await controller.create(mockCurrentUser as never, dto);
      expect(result.message).toBe('Notification created');
      expect(dispatchService.dispatch).toHaveBeenCalled();
    });
  });

  describe('POST /admin/notifications/trigger/auth-thresholds', () => {
    it('should trigger all auth thresholds', async () => {
      const result = await controller.triggerAuthThresholds(mockCurrentUser as never, {});
      expect(result.message).toBe('Auth threshold check completed');
      expect(triggerService.checkAllAuthThresholds).toHaveBeenCalled();
    });

    it('should trigger single auth threshold', async () => {
      await controller.triggerAuthThresholds(mockCurrentUser as never, {
        authorization_id: 'auth-uuid',
      });
      expect(triggerService.onAuthUtilizationChanged).toHaveBeenCalledWith('org-uuid', 'auth-uuid');
    });
  });

  describe('POST /admin/notifications/trigger/review-reminders', () => {
    it('should trigger review reminders', async () => {
      const result = await controller.triggerReviewReminders(mockCurrentUser as never, {});
      expect(result.data).toEqual({ checked: 5, alerts: 1 });
    });
  });

  describe('POST /admin/notifications/cleanup', () => {
    it('should cleanup old notifications', async () => {
      const result = await controller.cleanup(mockCurrentUser as never);
      expect(result.data).toEqual({ deleted: 5 });
    });
  });
});
