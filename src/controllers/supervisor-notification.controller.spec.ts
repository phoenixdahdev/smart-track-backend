import { SupervisorNotificationController } from './supervisor-notification.controller';

describe('SupervisorNotificationController', () => {
  let controller: SupervisorNotificationController;
  let notificationService: {
    listByUser: jest.Mock;
    getUnreadCount: jest.Mock;
    markRead: jest.Mock;
    markAllRead: jest.Mock;
  };
  let preferenceService: { getOrCreate: jest.Mock; update: jest.Mock };
  let triggerService: { checkOverdueReviews: jest.Mock };

  const mockCurrentUser = {
    id: 'supervisor-uuid',
    org_id: 'org-uuid',
    role: 'SUPERVISOR',
    email: 'supervisor@test.com',
    name: 'Supervisor User',
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
        payload: [],
        paginationMeta: { total: 0 },
      }),
      getUnreadCount: jest.fn().mockResolvedValue({ count: 0 }),
      markRead: jest.fn().mockResolvedValue({ id: 'notif-uuid', read: true }),
      markAllRead: jest.fn().mockResolvedValue({ updated: 0 }),
    };

    preferenceService = {
      getOrCreate: jest.fn().mockResolvedValue({ email_enabled: true }),
      update: jest.fn().mockResolvedValue({ email_enabled: true }),
    };

    triggerService = {
      checkOverdueReviews: jest.fn().mockResolvedValue({ checked: 3, alerts: 1 }),
    };

    controller = new SupervisorNotificationController(
      notificationService as never,
      preferenceService as never,
      triggerService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /supervisor/notifications', () => {
    it('should list notifications', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);
      expect(result.message).toBe('Notifications retrieved');
    });
  });

  describe('GET /supervisor/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const result = await controller.unreadCount(mockCurrentUser as never);
      expect(result.data).toEqual({ count: 0 });
    });
  });

  describe('GET /supervisor/notifications/preferences', () => {
    it('should return preferences', async () => {
      const result = await controller.getPreferences(mockCurrentUser as never);
      expect(result.message).toBe('Preferences retrieved');
    });
  });

  describe('PATCH /supervisor/notifications/preferences', () => {
    it('should update preferences', async () => {
      const result = await controller.updatePreferences(
        mockCurrentUser as never, { in_app_enabled: false },
      );
      expect(result.message).toBe('Preferences updated');
    });
  });

  describe('PATCH /supervisor/notifications/:id/read', () => {
    it('should mark as read', async () => {
      const result = await controller.markRead('notif-uuid', mockCurrentUser as never);
      expect(result.message).toBe('Notification marked as read');
    });
  });

  describe('POST /supervisor/notifications/mark-all-read', () => {
    it('should mark all as read', async () => {
      const result = await controller.markAllRead(mockCurrentUser as never, {});
      expect(result.message).toBe('Notifications marked as read');
    });
  });

  describe('POST /supervisor/notifications/trigger/review-reminders', () => {
    it('should trigger review reminders', async () => {
      const result = await controller.triggerReviewReminders(mockCurrentUser as never, {});
      expect(result.data).toEqual({ checked: 3, alerts: 1 });
    });

    it('should pass custom overdue_hours', async () => {
      await controller.triggerReviewReminders(mockCurrentUser as never, { overdue_hours: 24 });
      expect(triggerService.checkOverdueReviews).toHaveBeenCalledWith('org-uuid', 24);
    });
  });
});
