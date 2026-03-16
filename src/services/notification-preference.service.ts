import { Injectable } from '@nestjs/common';
import { NotificationPreferenceDal } from '@dals/notification-preference.dal';
import { type NotificationType } from '@enums/notification-type.enum';
import { type UpdateNotificationPreferenceDto } from '@dtos/update-notification-preference.dto';

@Injectable()
export class NotificationPreferenceService {
  constructor(
    private readonly preferenceDal: NotificationPreferenceDal,
  ) {}

  async getOrCreate(userId: string, orgId: string) {
    const existing = await this.preferenceDal.get({
      identifierOptions: { user_id: userId, org_id: orgId } as never,
    });

    if (existing) return existing;

    return this.preferenceDal.create({
      createPayload: {
        org_id: orgId,
        user_id: userId,
        email_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        preferences: {},
      } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async update(userId: string, orgId: string, dto: UpdateNotificationPreferenceDto) {
    await this.getOrCreate(userId, orgId);

    const updatePayload: Record<string, unknown> = {};
    if (dto.email_enabled !== undefined) updatePayload.email_enabled = dto.email_enabled;
    if (dto.sms_enabled !== undefined) updatePayload.sms_enabled = dto.sms_enabled;
    if (dto.in_app_enabled !== undefined) updatePayload.in_app_enabled = dto.in_app_enabled;
    if (dto.preferences !== undefined) updatePayload.preferences = dto.preferences;

    return this.preferenceDal.update({
      identifierOptions: { user_id: userId, org_id: orgId } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async shouldNotify(
    userId: string,
    orgId: string,
    type: NotificationType,
    channel: 'email' | 'sms' | 'in_app',
  ): Promise<boolean> {
    const pref = await this.getOrCreate(userId, orgId);

    // Check channel-level toggle
    if (channel === 'email' && !pref.email_enabled) return false;
    if (channel === 'sms' && !pref.sms_enabled) return false;
    if (channel === 'in_app' && !pref.in_app_enabled) return false;

    // Check per-type override in JSONB preferences
    const typeKey = type as string;
    if (
      pref.preferences &&
      typeof pref.preferences === 'object' &&
      typeKey in pref.preferences
    ) {
      return !!pref.preferences[typeKey];
    }

    return true;
  }
}
