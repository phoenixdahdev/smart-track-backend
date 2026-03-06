import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { SmarttrackOperatorEntity } from './smarttrack-operator.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('break_glass_sessions')
export class BreakGlassSessionEntity extends BaseEntity {
  @Column('uuid')
  operator_id: string;

  @Column('uuid')
  org_id: string;

  @Column({ type: 'varchar', length: 100 })
  ticket_id: string;

  @Column('text')
  reason: string;

  @Column({ type: 'varchar', length: 50 })
  data_scope: string;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'timestamp' })
  start_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_at: Date | null;

  @Column({ type: 'text', nullable: true })
  actions_summary: string | null;

  @ManyToOne(() => SmarttrackOperatorEntity)
  @JoinColumn({ name: 'operator_id' })
  operator: SmarttrackOperatorEntity;

  @ManyToOne(() => SmarttrackOperatorEntity)
  @JoinColumn({ name: 'approved_by' })
  approver: SmarttrackOperatorEntity;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'org_id' })
  organization: OrganizationEntity;
}
