import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationType } from '@enums/notification-type.enum';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationDal: {
    create: jest.Mock;
    get: jest.Mock;
    find: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockNotification = {
    id: 'notif-uuid',
    org_id: 'org-uuid',
    user_id: 'user-uuid',
    type: NotificationType.SYSTEM,
    title: 'Test notification',
    message: 'Test message',
    entity_type: null,
    entity_id: null,
    read: false,
    read_at: null,
    created_at: new Date('2026-03-15'),
  };

  beforeEach(() => {
    notificationDal = {
      create: jest.fn().mockResolvedValue(mockNotification),
      get: jest.fn().mockResolvedValue(mockNotification),
      find: jest.fn().mockResolvedValue({
        payload: [mockNotification],
        paginationMeta: { total: 1 },
      }),
      update: jest.fn().mockResolvedValue({ ...mockNotification, read: true }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    auditLogService = { logAgencyAction: jest.fn().mockResolvedValue(undefined) };

    service = new NotificationService(
      notificationDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const result = await service.create({
        orgId: 'org-uuid',
        userId: 'user-uuid',
        type: NotificationType.SYSTEM,
        title: 'Test',
        message: 'Test message',
      });

      expect(result).toEqual(mockNotification);
      expect(notificationDal.create).toHaveBeenCalledTimes(1);
    });

    it('should create with entity reference', async () => {
      await service.create({
        orgId: 'org-uuid',
        userId: 'user-uuid',
        type: NotificationType.CLAIM_STATUS,
        title: 'Claim update',
        message: 'Claim status changed',
        entityType: 'claims',
        entityId: 'claim-uuid',
      });

      expect(notificationDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            entity_type: 'claims',
            entity_id: 'claim-uuid',
          }) as unknown,
        }),
      );
    });
  });

  describe('createBulk', () => {
    it('should create notifications for multiple users', async () => {
      const result = await service.createBulk({
        orgId: 'org-uuid',
        userIds: ['user-1', 'user-2', 'user-3'],
        type: NotificationType.SYSTEM,
        title: 'Bulk test',
        message: 'Bulk message',
      });

      expect(result).toHaveLength(3);
      expect(notificationDal.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('findById', () => {
    it('should return a notification', async () => {
      const result = await service.findById('notif-uuid', 'org-uuid');
      expect(result).toEqual(mockNotification);
    });

    it('should throw NotFoundException when not found', async () => {
      notificationDal.get.mockResolvedValue(null);
      await expect(service.findById('missing', 'org-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listByUser', () => {
    it('should list notifications with pagination', async () => {
      const result = await service.listByUser('user-uuid', 'org-uuid', {
        page: '1',
        limit: '10',
      });

      expect(result.payload).toHaveLength(1);
      expect(notificationDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { page: 1, limit: 10 },
        }),
      );
    });

    it('should apply type filter', async () => {
      await service.listByUser('user-uuid', 'org-uuid', undefined, {
        type: NotificationType.CLAIM_STATUS,
      });

      expect(notificationDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            type: NotificationType.CLAIM_STATUS,
          }) as unknown,
        }),
      );
    });

    it('should apply read filter', async () => {
      await service.listByUser('user-uuid', 'org-uuid', undefined, {
        read: false,
      });

      expect(notificationDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ read: false }) as unknown,
        }),
      );
    });
  });

  describe('markRead', () => {
    it('should mark a notification as read', async () => {
      const result = await service.markRead('notif-uuid', 'org-uuid', 'user-uuid');

      expect(result.read).toBe(true);
      expect(notificationDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({ read: true }) as unknown,
        }),
      );
    });

    it('should throw NotFoundException if user does not own notification', async () => {
      notificationDal.get.mockResolvedValue({
        ...mockNotification,
        user_id: 'other-user',
      });

      await expect(
        service.markRead('notif-uuid', 'org-uuid', 'user-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllRead', () => {
    it('should mark all unread notifications as read', async () => {
      const result = await service.markAllRead('user-uuid', 'org-uuid');

      expect(result.updated).toBe(1);
      expect(notificationDal.update).toHaveBeenCalledTimes(1);
    });

    it('should filter by type when provided', async () => {
      await service.markAllRead('user-uuid', 'org-uuid', NotificationType.SYSTEM);

      expect(notificationDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            type: NotificationType.SYSTEM,
          }) as unknown,
        }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const result = await service.getUnreadCount('user-uuid', 'org-uuid');
      expect(result).toEqual({ count: 1 });
    });

    it('should return 0 when no unread', async () => {
      notificationDal.find.mockResolvedValue({ payload: [] });
      const result = await service.getUnreadCount('user-uuid', 'org-uuid');
      expect(result).toEqual({ count: 0 });
    });
  });

  describe('deleteOld', () => {
    it('should delete old read notifications', async () => {
      const oldNotification = {
        ...mockNotification,
        read: true,
        created_at: new Date('2025-01-01'),
      };
      notificationDal.find.mockResolvedValue({ payload: [oldNotification] });

      const result = await service.deleteOld('org-uuid', 90);

      expect(result.deleted).toBe(1);
      expect(notificationDal.delete).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when no old notifications', async () => {
      notificationDal.find.mockResolvedValue({ payload: [] });
      const result = await service.deleteOld('org-uuid', 90);
      expect(result.deleted).toBe(0);
    });
  });
});
