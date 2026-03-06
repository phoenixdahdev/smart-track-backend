import {
  Column,
  Entity,
  Index,
} from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';

@Entity('audit_logs')
@Index('idx_audit_logs_user_id', ['user_id'])
@Index('idx_audit_logs_action', ['action'])
@Index('idx_audit_logs_table_name', ['table_name'])
@Index('idx_audit_logs_created_at', ['created_at'])
export class AuditLogEntity extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 50 })
  user_role: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  action_type: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  table_name: string | null;

  @Column({ type: 'uuid', nullable: true })
  record_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  before_val: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  after_val: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 45 })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;
}
