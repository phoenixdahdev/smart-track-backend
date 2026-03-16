import { NotificationTriggerService } from './notification-trigger.service';
import { AuthorizationStatus } from '@enums/authorization-status.enum';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';

describe('NotificationTriggerService', () => {
  let service: NotificationTriggerService;
  let dispatchService: {
    dispatch: jest.Mock;
    dispatchBulk: jest.Mock;
    dispatchToRole: jest.Mock;
  };
  let serviceAuthorizationDal: { get: jest.Mock; find: jest.Mock };
  let serviceRecordDal: { find: jest.Mock };
  let userDal: { find: jest.Mock };
  let notificationDal: { find: jest.Mock };

  const mockAuth = {
    id: 'auth-uuid',
    org_id: 'org-uuid',
    units_authorized: 100,
    units_used: 0,
    units_pending: 0,
    status: AuthorizationStatus.ACTIVE,
    end_date: '2026-12-31',
  };

  beforeEach(() => {
    dispatchService = {
      dispatch: jest.fn().mockResolvedValue(undefined),
      dispatchBulk: jest.fn().mockResolvedValue(undefined),
      dispatchToRole: jest.fn().mockResolvedValue(undefined),
    };

    serviceAuthorizationDal = {
      get: jest.fn().mockResolvedValue(mockAuth),
      find: jest.fn().mockResolvedValue({ payload: [mockAuth] }),
    };

    serviceRecordDal = {
      find: jest.fn().mockResolvedValue({ payload: [] }),
    };

    userDal = {
      find: jest.fn().mockResolvedValue({ payload: [] }),
    };

    notificationDal = {
      find: jest.fn().mockResolvedValue({ payload: [] }),
    };

    service = new NotificationTriggerService(
      dispatchService as never,
      serviceAuthorizationDal as never,
      serviceRecordDal as never,
      userDal as never,
      notificationDal as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── Auth Threshold ─────────────────────────────────────────

  describe('onAuthUtilizationChanged', () => {
    it('should dispatch alert when usage >= 80%', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockAuth,
        units_used: 82,
      });

      await service.onAuthUtilizationChanged('org-uuid', 'auth-uuid');

      expect(dispatchService.dispatchToRole).toHaveBeenCalled();
    });

    it('should dispatch alert when usage >= 95%', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockAuth,
        units_used: 96,
      });

      await service.onAuthUtilizationChanged('org-uuid', 'auth-uuid');

      expect(dispatchService.dispatchToRole).toHaveBeenCalled();
    });

    it('should dispatch alert when usage exceeded', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockAuth,
        units_used: 110,
      });

      await service.onAuthUtilizationChanged('org-uuid', 'auth-uuid');

      expect(dispatchService.dispatchToRole).toHaveBeenCalled();
    });

    it('should skip when usage < 80%', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockAuth,
        units_used: 50,
      });

      await service.onAuthUtilizationChanged('org-uuid', 'auth-uuid');

      expect(dispatchService.dispatchToRole).not.toHaveBeenCalled();
    });

    it('should skip when auth not ACTIVE', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockAuth,
        status: AuthorizationStatus.VOIDED,
      });

      await service.onAuthUtilizationChanged('org-uuid', 'auth-uuid');

      expect(dispatchService.dispatchToRole).not.toHaveBeenCalled();
    });

    it('should skip when auth not found', async () => {
      serviceAuthorizationDal.get.mockResolvedValue(null);

      await service.onAuthUtilizationChanged('org-uuid', 'auth-uuid');

      expect(dispatchService.dispatchToRole).not.toHaveBeenCalled();
    });

    it('should dedup when same alert sent in last 24h', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockAuth,
        units_used: 82,
      });

      notificationDal.find.mockResolvedValue({
        payload: [
          {
            title: 'Authorization NEAR LIMIT 80',
            created_at: new Date(),
          },
        ],
      });

      await service.onAuthUtilizationChanged('org-uuid', 'auth-uuid');

      expect(dispatchService.dispatchToRole).not.toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      serviceAuthorizationDal.get.mockRejectedValue(new Error('DB error'));

      await expect(
        service.onAuthUtilizationChanged('org-uuid', 'auth-uuid'),
      ).resolves.not.toThrow();
    });
  });

  describe('checkAllAuthThresholds', () => {
    it('should check all active authorizations', async () => {
      serviceAuthorizationDal.find.mockResolvedValue({
        payload: [
          { ...mockAuth, id: 'auth-1', units_used: 85 },
          { ...mockAuth, id: 'auth-2', units_used: 50 },
        ],
      });

      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockAuth,
        units_used: 85,
      });

      const result = await service.checkAllAuthThresholds('org-uuid');

      expect(result.checked).toBe(2);
      expect(result.alerts).toBe(1);
    });
  });

  describe('checkExpiringAuthorizations', () => {
    it('should detect expiring authorizations', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);

      serviceAuthorizationDal.find.mockResolvedValue({
        payload: [
          { ...mockAuth, end_date: tomorrow.toISOString().split('T')[0] },
        ],
      });

      const result = await service.checkExpiringAuthorizations('org-uuid');

      expect(result.checked).toBe(1);
      expect(result.alerts).toBe(1);
    });

    it('should skip non-expiring authorizations', async () => {
      serviceAuthorizationDal.find.mockResolvedValue({
        payload: [{ ...mockAuth, end_date: '2027-12-31' }],
      });

      const result = await service.checkExpiringAuthorizations('org-uuid');

      expect(result.checked).toBe(1);
      expect(result.alerts).toBe(0);
    });
  });

  // ── Claim Status ───────────────────────────────────────────

  describe('onClaimStatusChanged', () => {
    it('should dispatch to billing and finance roles', async () => {
      await service.onClaimStatusChanged('org-uuid', 'claim-uuid', 'DRAFT', 'SUBMITTED');

      expect(dispatchService.dispatchToRole).toHaveBeenCalledTimes(2);
    });

    it('should not throw on error', async () => {
      dispatchService.dispatchToRole.mockRejectedValue(new Error('fail'));

      await expect(
        service.onClaimStatusChanged('org-uuid', 'claim-uuid', 'DRAFT', 'SUBMITTED'),
      ).resolves.not.toThrow();
    });
  });

  // ── Review Reminders ───────────────────────────────────────

  describe('checkOverdueReviews', () => {
    it('should detect overdue reviews', async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 72);

      serviceRecordDal.find.mockResolvedValue({
        payload: [
          {
            id: 'record-uuid',
            org_id: 'org-uuid',
            status: ServiceRecordStatus.PENDING_REVIEW,
            created_at: oldDate,
          },
        ],
      });

      const result = await service.checkOverdueReviews('org-uuid', 48);

      expect(result.checked).toBe(1);
      expect(result.alerts).toBe(1);
      expect(dispatchService.dispatchToRole).toHaveBeenCalled();
    });

    it('should skip non-overdue records', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [
          {
            id: 'record-uuid',
            status: ServiceRecordStatus.PENDING_REVIEW,
            created_at: new Date(),
          },
        ],
      });

      const result = await service.checkOverdueReviews('org-uuid', 48);

      expect(result.checked).toBe(1);
      expect(result.alerts).toBe(0);
    });
  });

  // ── Shift Notifications ────────────────────────────────────

  describe('onShiftPublished', () => {
    it('should dispatch to staff user', async () => {
      await service.onShiftPublished('org-uuid', 'shift-uuid', 'staff-uuid');

      expect(dispatchService.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'staff-uuid',
          entityType: 'shifts',
          entityId: 'shift-uuid',
        }),
      );
    });
  });

  describe('onShiftCancelled', () => {
    it('should dispatch to staff user', async () => {
      await service.onShiftCancelled('org-uuid', 'shift-uuid', 'staff-uuid');

      expect(dispatchService.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'staff-uuid',
          title: 'Shift cancelled',
        }),
      );
    });
  });

  // ── Onboarding ─────────────────────────────────────────────

  describe('onOnboardingTaskCompleted', () => {
    it('should dispatch to admin role', async () => {
      await service.onOnboardingTaskCompleted('org-uuid', 'task-uuid');

      expect(dispatchService.dispatchToRole).toHaveBeenCalledWith(
        'org-uuid',
        'ADMIN',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'onboarding_tasks',
        'task-uuid',
      );
    });
  });

  describe('onOnboardingCompleted', () => {
    it('should dispatch to admin role', async () => {
      await service.onOnboardingCompleted('org-uuid', 'checklist-uuid');

      expect(dispatchService.dispatchToRole).toHaveBeenCalledWith(
        'org-uuid',
        'ADMIN',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'onboarding_checklists',
        'checklist-uuid',
      );
    });
  });

  // ── Break-Glass ────────────────────────────────────────────

  describe('onBreakGlassRequested', () => {
    it('should dispatch to admin and agency_owner roles', async () => {
      await service.onBreakGlassRequested('org-uuid', 'session-uuid');

      expect(dispatchService.dispatchToRole).toHaveBeenCalledTimes(2);
    });
  });

  describe('onBreakGlassApproved', () => {
    it('should dispatch to admin and agency_owner roles', async () => {
      await service.onBreakGlassApproved('org-uuid', 'session-uuid');

      expect(dispatchService.dispatchToRole).toHaveBeenCalledTimes(2);
    });
  });

  // ── EVV Alert ──────────────────────────────────────────────

  describe('onEvvAlert', () => {
    it('should dispatch to supervisor role', async () => {
      await service.onEvvAlert('org-uuid', 'evv-uuid', 'GPS mismatch detected');

      expect(dispatchService.dispatchToRole).toHaveBeenCalledWith(
        'org-uuid',
        'SUPERVISOR',
        expect.anything(),
        'EVV Alert',
        'GPS mismatch detected',
        'evv_punches',
        'evv-uuid',
      );
    });
  });
});
