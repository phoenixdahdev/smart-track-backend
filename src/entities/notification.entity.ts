import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { NotificationType } from '@enums/notification-type.enum';
import { UserEntity } from './user.entity';

@Entity('notifications')
@Index(['user_id'])
@Index(['read'])
@Index(['type'])
@Index(['created_at'])
export class NotificationEntity extends TenantBaseEntity {
  @Column('uuid')
  user_id: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entity_type: string | null;

  @Column({ type: 'uuid', nullable: true })
  entity_id: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column('text')
  message: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
