import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('platform_audit_log')
@Index(['operator_id'])
@Index(['action'])
@Index(['created_at'])
export class PlatformAuditLogEntity extends BaseEntity {
  @Column('uuid')
  operator_id: string;

  @Column({ type: 'varchar', length: 50 })
  operator_role: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  target_type: string | null;

  @Column({ type: 'uuid', nullable: true })
  target_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  before_val: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  after_val: Record<string, any> | null;

  @Column({ type: 'varchar', length: 45 })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;
}
