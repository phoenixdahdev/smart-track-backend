import { Injectable, Logger } from '@nestjs/common';
import { NotificationDispatchService } from './notification-dispatch.service';
import { ServiceAuthorizationDal } from '@dals/service-authorization.dal';
import { ServiceRecordDal } from '@dals/service-record.dal';
import { UserDal } from '@dals/user.dal';
import { NotificationDal } from '@dals/notification.dal';
import { NotificationType } from '@enums/notification-type.enum';
import { AuthorizationStatus } from '@enums/authorization-status.enum';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import { AgencyRole } from '@enums/role.enum';

@Injectable()
export class NotificationTriggerService {
  private readonly logger = new Logger(NotificationTriggerService.name);

  constructor(
    private readonly dispatchService: NotificationDispatchService,
    private readonly serviceAuthorizationDal: ServiceAuthorizationDal,
    private readonly serviceRecordDal: ServiceRecordDal,
    private readonly userDal: UserDal,
    private readonly notificationDal: NotificationDal,
  ) {}

  // ── Auth Threshold Alerts ──────────────────────────────────────

  async onAuthUtilizationChanged(orgId: string, authId: string): Promise<void> {
    try {
      const auth = await this.serviceAuthorizationDal.get({
        identifierOptions: { id: authId, org_id: orgId } as never,
      });

      if (!auth || auth.status !== AuthorizationStatus.ACTIVE) return;

      const totalUsed = Number(auth.units_used) + Number(auth.units_pending);
      const authorized = Number(auth.units_authorized);
      if (authorized <= 0) return;

      const usagePercent = (totalUsed / authorized) * 100;

      let alertType: string | null = null;
      let message: string;

      if (totalUsed > authorized) {
        alertType = 'EXCEEDED';
        message = `Authorization exceeded: ${totalUsed}/${authorized} units used`;
      } else if (usagePercent >= 95) {
        alertType = 'NEAR_LIMIT_95';
        message = `Authorization at ${usagePercent.toFixed(1)}%: ${totalUsed}/${authorized} units`;
      } else if (usagePercent >= 80) {
        alertType = 'NEAR_LIMIT_80';
        message = `Authorization at ${usagePercent.toFixed(1)}%: ${totalUsed}/${authorized} units`;
      } else {
        return;
      }

      // Dedup: skip if same auth+alertType notified in last 24h
      const isDuplicate = await this.isDuplicateNotification(
        orgId,
        'service_authorizations',
        authId,
        alertType,
      );
      if (isDuplicate) return;

      await this.dispatchService.dispatchToRole(
        orgId,
        AgencyRole.BILLING_SPECIALIST,
        NotificationType.AUTH_THRESHOLD,
        `Authorization ${alertType.replace(/_/g, ' ')}`,
        message,
        'service_authorizations',
        authId,
      );

      await this.dispatchService.dispatchToRole(
        orgId,
        AgencyRole.ADMIN,
        NotificationType.AUTH_THRESHOLD,
        `Authorization ${alertType.replace(/_/g, ' ')}`,
        message,
        'service_authorizations',
        authId,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`onAuthUtilizationChanged failed: ${msg}`);
    }
  }

  async checkAllAuthThresholds(orgId: string) {
    let checked = 0;
    let alerts = 0;

    try {
      const auths = await this.serviceAuthorizationDal.find({
        findOptions: { org_id: orgId, status: AuthorizationStatus.ACTIVE } as never,
        transactionOptions: { useTransaction: false },
      });

      for (const auth of auths.payload) {
        checked++;
        const totalUsed = Number(auth.units_used) + Number(auth.units_pending);
        const authorized = Number(auth.units_authorized);

        if (authorized > 0) {
          const usagePercent = (totalUsed / authorized) * 100;
          if (usagePercent >= 80 || totalUsed > authorized) {
            await this.onAuthUtilizationChanged(orgId, auth.id);
            alerts++;
          }
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`checkAllAuthThresholds failed: ${msg}`);
    }

    return { checked, alerts };
  }

  async checkExpiringAuthorizations(orgId: string) {
    let checked = 0;
    let alerts = 0;

    try {
      const auths = await this.serviceAuthorizationDal.find({
        findOptions: { org_id: orgId, status: AuthorizationStatus.ACTIVE } as never,
        transactionOptions: { useTransaction: false },
      });

      const today = new Date();

      for (const auth of auths.payload) {
        checked++;
        const endDate = new Date(auth.end_date);
        const daysUntilExpiry = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        let alertType: string | null = null;

        if (daysUntilExpiry <= 0) {
          alertType = 'EXPIRED';
        } else if (daysUntilExpiry <= 1) {
          alertType = 'EXPIRING_TODAY';
        } else if (daysUntilExpiry <= 7) {
          alertType = 'EXPIRING_7';
        } else if (daysUntilExpiry <= 30) {
          alertType = 'EXPIRING_30';
        }

        if (!alertType) continue;

        const isDuplicate = await this.isDuplicateNotification(
          orgId,
          'service_authorizations',
          auth.id,
          alertType,
        );
        if (isDuplicate) continue;

        const message =
          daysUntilExpiry <= 0
            ? 'Authorization has expired'
            : `Authorization expires in ${daysUntilExpiry} day(s)`;

        await this.dispatchService.dispatchToRole(
          orgId,
          AgencyRole.BILLING_SPECIALIST,
          NotificationType.AUTH_THRESHOLD,
          `Authorization ${alertType.replace(/_/g, ' ')}`,
          message,
          'service_authorizations',
          auth.id,
        );

        alerts++;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`checkExpiringAuthorizations failed: ${msg}`);
    }

    return { checked, alerts };
  }

  // ── Claim Status ───────────────────────────────────────────────

  async onClaimStatusChanged(
    orgId: string,
    claimId: string,
    fromStatus: string,
    toStatus: string,
  ): Promise<void> {
    try {
      const title = 'Claim status updated';
      const message = `Claim transitioned from ${fromStatus} to ${toStatus}`;

      await this.dispatchService.dispatchToRole(
        orgId,
        AgencyRole.BILLING_SPECIALIST,
        NotificationType.CLAIM_STATUS,
        title,
        message,
        'claims',
        claimId,
      );

      await this.dispatchService.dispatchToRole(
        orgId,
        AgencyRole.FINANCE_MANAGER,
        NotificationType.CLAIM_STATUS,
        title,
        message,
        'claims',
        claimId,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`onClaimStatusChanged failed: ${msg}`);
    }
  }

  // ── Review Reminders ───────────────────────────────────────────

  async checkOverdueReviews(orgId: string, overdueHours = 48) {
    let checked = 0;
    let alerts = 0;

    try {
      const records = await this.serviceRecordDal.find({
        findOptions: {
          org_id: orgId,
          status: ServiceRecordStatus.PENDING_REVIEW,
        } as never,
        transactionOptions: { useTransaction: false },
      });

      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - overdueHours);

      for (const record of records.payload) {
        checked++;
        const createdAt = new Date(record.created_at);

        if (createdAt > cutoff) continue;

        const isDuplicate = await this.isDuplicateNotification(
          orgId,
          'service_records',
          record.id,
          'OVERDUE_REVIEW',
        );
        if (isDuplicate) continue;

        const message = `Service record has been pending review for over ${overdueHours} hours`;

        await this.dispatchService.dispatchToRole(
          orgId,
          AgencyRole.SUPERVISOR,
          NotificationType.REVIEW_REMINDER,
          'Overdue review reminder',
          message,
          'service_records',
          record.id,
        );

        await this.dispatchService.dispatchToRole(
          orgId,
          AgencyRole.ADMIN,
          NotificationType.REVIEW_REMINDER,
          'Overdue review reminder',
          message,
          'service_records',
          record.id,
        );

        alerts++;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`checkOverdueReviews failed: ${msg}`);
    }

    return { checked, alerts };
  }

  // ── Shift Notifications ────────────────────────────────────────

  async onShiftPublished(
    orgId: string,
    shiftId: string,
    staffId: string,
  ): Promise<void> {
    try {
      await this.dispatchService.dispatch({
        orgId,
        userId: staffId,
        type: NotificationType.SHIFT_UPDATE,
        title: 'New shift published',
        message: 'A new shift has been published for you',
        entityType: 'shifts',
        entityId: shiftId,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`onShiftPublished failed: ${msg}`);
    }
  }

  async onShiftCancelled(
    orgId: string,
    shiftId: string,
    staffId: string,
  ): Promise<void> {
    try {
      await this.dispatchService.dispatch({
        orgId,
        userId: staffId,
        type: NotificationType.SHIFT_UPDATE,
        title: 'Shift cancelled',
        message: 'One of your shifts has been cancelled',
        entityType: 'shifts',
        entityId: shiftId,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`onShiftCancelled failed: ${msg}`);
    }
  }

  // ── Onboarding ─────────────────────────────────────────────────

  async onOnboardingTaskCompleted(orgId: string, taskId: string): Promise<void> {
    try {
      await this.dispatchService.dispatchToRole(
        orgId,
        AgencyRole.ADMIN,
        NotificationType.ONBOARDING_STATUS,
        'Onboarding task completed',
        'An onboarding task has been completed',
        'onboarding_tasks',
        taskId,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`onOnboardingTaskCompleted failed: ${msg}`);
    }
  }

  async onOnboardingCompleted(orgId: string, checklistId: string): Promise<void> {
    try {
      await this.dispatchService.dispatchToRole(
        orgId,
        AgencyRole.ADMIN,
        NotificationType.ONBOARDING_STATUS,
        'Onboarding completed',
        'Organization onboarding has been completed',
        'onboarding_checklists',
        checklistId,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`onOnboardingCompleted failed: ${msg}`);
    }
  }

  // ── Break-Glass ────────────────────────────────────────────────

  async onBreakGlassRequested(orgId: string, sessionId: string): Promise<void> {
    try {
      const title = 'Break-glass access requested';
      const message = 'A break-glass emergency access session has been requested';

      await this.dispatchService.dispatchToRole(
        orgId,
        AgencyRole.ADMIN,
        NotificationType.BREAK_GLASS,
        title,
        message,
        'break_glass_sessions',
        sessionId,
      );

      await this.dispatchService.dispatchToRole(
        orgId,
        AgencyRole.AGENCY_OWNER,
        NotificationType.BREAK_GLASS,
        title,
        message,
        'break_glass_sessions',
        sessionId,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`onBreakGlassRequested failed: ${msg}`);
    }
  }

  async onBreakGlassApproved(orgId: string, sessionId: string): Promise<void> {
    try {
      const title = 'Break-glass access approved';
      const message = 'A break-glass emergency access session has been approved';

      await this.dispatchService.dispatchToRole(
        orgId,
        AgencyRole.ADMIN,
        NotificationType.BREAK_GLASS,
        title,
        message,
        'break_glass_sessions',
        sessionId,
      );

      await this.dispatchService.dispatchToRole(
        orgId,
        AgencyRole.AGENCY_OWNER,
        NotificationType.BREAK_GLASS,
        title,
        message,
        'break_glass_sessions',
        sessionId,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`onBreakGlassApproved failed: ${msg}`);
    }
  }

  // ── EVV Alert (Stub) ──────────────────────────────────────────

  async onEvvAlert(orgId: string, entityId: string, message: string): Promise<void> {
    try {
      await this.dispatchService.dispatchToRole(
        orgId,
        AgencyRole.SUPERVISOR,
        NotificationType.EVV_ALERT,
        'EVV Alert',
        message,
        'evv_punches',
        entityId,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`onEvvAlert failed: ${msg}`);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────

  private async isDuplicateNotification(
    orgId: string,
    entityType: string,
    entityId: string,
    alertType: string,
  ): Promise<boolean> {
    const since = new Date();
    since.setHours(since.getHours() - 24);

    const existing = await this.notificationDal.find({
      findOptions: {
        org_id: orgId,
        entity_type: entityType,
        entity_id: entityId,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    return existing.payload.some((n: { title: string; created_at: Date }) => {
      const createdAt = new Date(n.created_at);
      return (
        createdAt >= since &&
        n.title.includes(alertType.replace(/_/g, ' '))
      );
    });
  }
}
