import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationType } from '@enums/notification-type.enum';

describe('NotificationPreferenceService', () => {
  let service: NotificationPreferenceService;
  let preferenceDal: {
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  const mockPreference = {
    id: 'pref-uuid',
    org_id: 'org-uuid',
    user_id: 'user-uuid',
    email_enabled: true,
    sms_enabled: false,
    in_app_enabled: true,
    preferences: {},
  };

  beforeEach(() => {
    preferenceDal = {
      get: jest.fn().mockResolvedValue(mockPreference),
      create: jest.fn().mockResolvedValue(mockPreference),
      update: jest.fn().mockResolvedValue(mockPreference),
    };

    service = new NotificationPreferenceService(preferenceDal as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreate', () => {
    it('should return existing preference', async () => {
      const result = await service.getOrCreate('user-uuid', 'org-uuid');

      expect(result).toEqual(mockPreference);
      expect(preferenceDal.get).toHaveBeenCalledTimes(1);
      expect(preferenceDal.create).not.toHaveBeenCalled();
    });

    it('should create default preference when none exists', async () => {
      preferenceDal.get.mockResolvedValue(null);

      await service.getOrCreate('user-uuid', 'org-uuid');

      expect(preferenceDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            email_enabled: true,
            sms_enabled: false,
            in_app_enabled: true,
            preferences: {},
          }) as unknown,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update email_enabled', async () => {
      await service.update('user-uuid', 'org-uuid', { email_enabled: false });

      expect(preferenceDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({ email_enabled: false }) as unknown,
        }),
      );
    });

    it('should update preferences JSONB', async () => {
      const prefs = { AUTH_THRESHOLD: false, CLAIM_STATUS: true };
      await service.update('user-uuid', 'org-uuid', { preferences: prefs });

      expect(preferenceDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({ preferences: prefs }) as unknown,
        }),
      );
    });
  });

  describe('shouldNotify', () => {
    it('should return true for enabled channel', async () => {
      const result = await service.shouldNotify(
        'user-uuid',
        'org-uuid',
        NotificationType.SYSTEM,
        'email',
      );
      expect(result).toBe(true);
    });

    it('should return false for disabled channel (sms)', async () => {
      const result = await service.shouldNotify(
        'user-uuid',
        'org-uuid',
        NotificationType.SYSTEM,
        'sms',
      );
      expect(result).toBe(false);
    });

    it('should respect per-type override in preferences', async () => {
      preferenceDal.get.mockResolvedValue({
        ...mockPreference,
        email_enabled: true,
        preferences: { SYSTEM: false },
      });

      const result = await service.shouldNotify(
        'user-uuid',
        'org-uuid',
        NotificationType.SYSTEM,
        'email',
      );
      expect(result).toBe(false);
    });

    it('should return true when no per-type override exists', async () => {
      preferenceDal.get.mockResolvedValue({
        ...mockPreference,
        email_enabled: true,
        preferences: { CLAIM_STATUS: false },
      });

      const result = await service.shouldNotify(
        'user-uuid',
        'org-uuid',
        NotificationType.SYSTEM,
        'email',
      );
      expect(result).toBe(true);
    });

    it('should return false when in_app disabled', async () => {
      preferenceDal.get.mockResolvedValue({
        ...mockPreference,
        in_app_enabled: false,
      });

      const result = await service.shouldNotify(
        'user-uuid',
        'org-uuid',
        NotificationType.SYSTEM,
        'in_app',
      );
      expect(result).toBe(false);
    });
  });
});
