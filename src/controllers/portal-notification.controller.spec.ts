import { PortalNotificationController } from './portal-notification.controller';
import { NotificationType } from '@enums/notification-type.enum';

describe('PortalNotificationController', () => {
  let controller: PortalNotificationController;
  let notificationService: {
    listByUser: jest.Mock;
    getUnreadCount: jest.Mock;
    markRead: jest.Mock;
    markAllRead: jest.Mock;
  };
  let preferenceService: { getOrCreate: jest.Mock; update: jest.Mock };

  const mockCurrentUser = {
    id: 'guardian-uuid',
    org_id: 'org-uuid',
    role: 'GUARDIAN',
    email: 'guardian@test.com',
    name: 'Guardian User',
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
    user_id: 'guardian-uuid',
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
    };

    preferenceService = {
      getOrCreate: jest.fn().mockResolvedValue(mockPreference),
      update: jest.fn().mockResolvedValue(mockPreference),
    };

    controller = new PortalNotificationController(
      notificationService as never,
      preferenceService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /portal/notifications', () => {
    it('should list notifications', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);
      expect(result.message).toBe('Notifications retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /portal/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const result = await controller.unreadCount(mockCurrentUser as never);
      expect(result.data).toEqual({ count: 1 });
    });
  });

  describe('GET /portal/notifications/preferences', () => {
    it('should return preferences', async () => {
      const result = await controller.getPreferences(mockCurrentUser as never);
      expect(result.data).toEqual(mockPreference);
    });
  });

  describe('PATCH /portal/notifications/preferences', () => {
    it('should update preferences', async () => {
      const result = await controller.updatePreferences(
        mockCurrentUser as never,
        { email_enabled: false },
      );
      expect(result.message).toBe('Preferences updated');
    });
  });

  describe('PATCH /portal/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const result = await controller.markRead('notif-uuid', mockCurrentUser as never);
      expect(result.message).toBe('Notification marked as read');
    });
  });

  describe('POST /portal/notifications/mark-all-read', () => {
    it('should mark all as read', async () => {
      const result = await controller.markAllRead(mockCurrentUser as never, {});
      expect(result.data).toEqual({ updated: 1 });
    });
  });
});
