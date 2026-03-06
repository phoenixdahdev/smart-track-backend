import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { UserEntity } from './user.entity';

@Entity('notification_preferences')
export class NotificationPreferenceEntity extends TenantBaseEntity {
  @Column('uuid')
  user_id: string;

  @Column({ type: 'boolean', default: true })
  email_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  sms_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  in_app_enabled: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  preferences: Record<string, any>;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
