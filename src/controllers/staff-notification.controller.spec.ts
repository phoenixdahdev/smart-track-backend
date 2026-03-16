import { StaffNotificationController } from './staff-notification.controller';

describe('StaffNotificationController', () => {
  let controller: StaffNotificationController;
  let notificationService: {
    listByUser: jest.Mock;
    getUnreadCount: jest.Mock;
    markRead: jest.Mock;
    markAllRead: jest.Mock;
  };
  let preferenceService: { getOrCreate: jest.Mock; update: jest.Mock };

  const mockCurrentUser = {
    id: 'staff-uuid',
    org_id: 'org-uuid',
    role: 'DSP',
    email: 'staff@test.com',
    name: 'Staff User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  beforeEach(() => {
    notificationService = {
      listByUser: jest.fn().mockResolvedValue({
        payload: [{ id: 'notif-uuid', title: 'Shift update' }],
        paginationMeta: { total: 1 },
      }),
      getUnreadCount: jest.fn().mockResolvedValue({ count: 1 }),
      markRead: jest.fn().mockResolvedValue({ id: 'notif-uuid', read: true }),
      markAllRead: jest.fn().mockResolvedValue({ updated: 1 }),
    };

    preferenceService = {
      getOrCreate: jest.fn().mockResolvedValue({
        email_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
      }),
      update: jest.fn().mockResolvedValue({ email_enabled: false }),
    };

    controller = new StaffNotificationController(
      notificationService as never,
      preferenceService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /staff/notifications', () => {
    it('should list notifications', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);
      expect(result.message).toBe('Notifications retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /staff/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const result = await controller.unreadCount(mockCurrentUser as never);
      expect(result.data).toEqual({ count: 1 });
    });
  });

  describe('GET /staff/notifications/preferences', () => {
    it('should return preferences', async () => {
      const result = await controller.getPreferences(mockCurrentUser as never);
      expect(result.message).toBe('Preferences retrieved');
    });
  });

  describe('PATCH /staff/notifications/preferences', () => {
    it('should update preferences', async () => {
      const result = await controller.updatePreferences(
        mockCurrentUser as never, { email_enabled: false },
      );
      expect(result.message).toBe('Preferences updated');
    });
  });

  describe('PATCH /staff/notifications/:id/read', () => {
    it('should mark as read', async () => {
      const result = await controller.markRead('notif-uuid', mockCurrentUser as never);
      expect(result.message).toBe('Notification marked as read');
    });
  });

  describe('POST /staff/notifications/mark-all-read', () => {
    it('should mark all as read', async () => {
      const result = await controller.markAllRead(mockCurrentUser as never, {});
      expect(result.message).toBe('Notifications marked as read');
    });
  });
});
