import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationType } from '@enums/notification-type.enum';
import { AgencyRole } from '@enums/role.enum';

describe('NotificationDispatchService', () => {
  let service: NotificationDispatchService;
  let notificationService: { create: jest.Mock };
  let preferenceService: { shouldNotify: jest.Mock };
  let emailService: { sendNotification: jest.Mock };
  let userDal: { get: jest.Mock; find: jest.Mock };

  const mockUser = {
    id: 'user-uuid',
    email: 'user@test.com',
    name: 'Test',
  };

  beforeEach(() => {
    notificationService = {
      create: jest.fn().mockResolvedValue({ id: 'notif-uuid' }),
    };

    preferenceService = {
      shouldNotify: jest.fn().mockResolvedValue(true),
    };

    emailService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    };

    userDal = {
      get: jest.fn().mockResolvedValue(mockUser),
      find: jest.fn().mockResolvedValue({
        payload: [mockUser],
      }),
    };

    service = new NotificationDispatchService(
      notificationService as never,
      preferenceService as never,
      emailService as never,
      userDal as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dispatch', () => {
    const params = {
      orgId: 'org-uuid',
      userId: 'user-uuid',
      type: NotificationType.SYSTEM,
      title: 'Test',
      message: 'Test message',
    };

    it('should create in-app notification and send email', async () => {
      await service.dispatch(params);

      expect(notificationService.create).toHaveBeenCalledTimes(1);
      expect(emailService.sendNotification).toHaveBeenCalledWith(
        'user@test.com',
        'Test',
        'Test',
        'Test message',
      );
    });

    it('should skip in-app when preference disabled', async () => {
      preferenceService.shouldNotify.mockImplementation(
        (_uid: string, _oid: string, _type: string, channel: string) =>
          channel !== 'in_app',
      );

      await service.dispatch(params);

      expect(notificationService.create).not.toHaveBeenCalled();
      expect(emailService.sendNotification).toHaveBeenCalledTimes(1);
    });

    it('should skip email when preference disabled', async () => {
      preferenceService.shouldNotify.mockImplementation(
        (_uid: string, _oid: string, _type: string, channel: string) =>
          channel !== 'email',
      );

      await service.dispatch(params);

      expect(notificationService.create).toHaveBeenCalledTimes(1);
      expect(emailService.sendNotification).not.toHaveBeenCalled();
    });

    it('should not throw on internal error', async () => {
      notificationService.create.mockRejectedValue(new Error('DB error'));

      await expect(service.dispatch(params)).resolves.not.toThrow();
    });

    it('should include entity reference', async () => {
      await service.dispatch({
        ...params,
        entityType: 'claims',
        entityId: 'claim-uuid',
      });

      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'claims',
          entityId: 'claim-uuid',
        }),
      );
    });
  });

  describe('dispatchBulk', () => {
    it('should dispatch to all user IDs', async () => {
      await service.dispatchBulk({
        orgId: 'org-uuid',
        userIds: ['user-1', 'user-2'],
        type: NotificationType.SYSTEM,
        title: 'Bulk test',
        message: 'Bulk message',
      });

      // 2 users × (shouldNotify in_app + create + shouldNotify email + get user + sendNotification)
      expect(notificationService.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('dispatchToRole', () => {
    it('should find users by role and dispatch', async () => {
      await service.dispatchToRole(
        'org-uuid',
        AgencyRole.ADMIN,
        NotificationType.SYSTEM,
        'Test',
        'Test message',
      );

      expect(userDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            org_id: 'org-uuid',
            role: AgencyRole.ADMIN,
          }) as unknown,
        }),
      );
      expect(notificationService.create).toHaveBeenCalledTimes(1);
    });

    it('should not dispatch when no users found', async () => {
      userDal.find.mockResolvedValue({ payload: [] });

      await service.dispatchToRole(
        'org-uuid',
        AgencyRole.ADMIN,
        NotificationType.SYSTEM,
        'Test',
        'Test message',
      );

      expect(notificationService.create).not.toHaveBeenCalled();
    });

    it('should not throw on internal error', async () => {
      userDal.find.mockRejectedValue(new Error('DB error'));

      await expect(
        service.dispatchToRole(
          'org-uuid',
          AgencyRole.ADMIN,
          NotificationType.SYSTEM,
          'Test',
          'Test message',
        ),
      ).resolves.not.toThrow();
    });

    it('should pass entity reference through', async () => {
      await service.dispatchToRole(
        'org-uuid',
        AgencyRole.ADMIN,
        NotificationType.CLAIM_STATUS,
        'Claim update',
        'Status changed',
        'claims',
        'claim-uuid',
      );

      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'claims',
          entityId: 'claim-uuid',
        }),
      );
    });
  });
});
