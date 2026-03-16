import { ClinicalNotificationController } from './clinical-notification.controller';

describe('ClinicalNotificationController', () => {
  let controller: ClinicalNotificationController;
  let notificationService: {
    listByUser: jest.Mock;
    getUnreadCount: jest.Mock;
    markRead: jest.Mock;
    markAllRead: jest.Mock;
  };
  let preferenceService: { getOrCreate: jest.Mock; update: jest.Mock };

  const mockCurrentUser = {
    id: 'clinician-uuid',
    org_id: 'org-uuid',
    role: 'CLINICIAN',
    email: 'clinician@test.com',
    name: 'Clinician User',
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
      getOrCreate: jest.fn().mockResolvedValue({
        email_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
      }),
      update: jest.fn().mockResolvedValue({ email_enabled: true }),
    };

    controller = new ClinicalNotificationController(
      notificationService as never,
      preferenceService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /clinical/notifications', () => {
    it('should list notifications', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);
      expect(result.message).toBe('Notifications retrieved');
    });
  });

  describe('GET /clinical/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const result = await controller.unreadCount(mockCurrentUser as never);
      expect(result.data).toEqual({ count: 0 });
    });
  });

  describe('GET /clinical/notifications/preferences', () => {
    it('should return preferences', async () => {
      const result = await controller.getPreferences(mockCurrentUser as never);
      expect(result.message).toBe('Preferences retrieved');
    });
  });

  describe('PATCH /clinical/notifications/preferences', () => {
    it('should update preferences', async () => {
      const result = await controller.updatePreferences(
        mockCurrentUser as never, { sms_enabled: true },
      );
      expect(result.message).toBe('Preferences updated');
    });
  });

  describe('PATCH /clinical/notifications/:id/read', () => {
    it('should mark as read', async () => {
      const result = await controller.markRead('notif-uuid', mockCurrentUser as never);
      expect(result.message).toBe('Notification marked as read');
    });
  });

  describe('POST /clinical/notifications/mark-all-read', () => {
    it('should mark all as read', async () => {
      const result = await controller.markAllRead(mockCurrentUser as never, {});
      expect(result.message).toBe('Notifications marked as read');
    });
  });
});
