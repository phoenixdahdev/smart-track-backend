import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ApplicationStatus } from '@enums/application-status.enum';
import { SmarttrackOperatorEntity } from './smarttrack-operator.entity';

@Entity('signup_applications')
@Index(['status'])
@Index(['npi'])
@Index(['submitted_at'])
export class SignupApplicationEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  org_name: string;

  @Column({ type: 'varchar', length: 10 })
  npi: string;

  @Column({ type: 'varchar', length: 10 })
  ein: string;

  @Column({ type: 'varchar', length: 255 })
  contact_name: string;

  @Column({ type: 'varchar', length: 255 })
  contact_email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contact_phone: string | null;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.SUBMITTED,
  })
  status: ApplicationStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  plan_tier: string | null;

  @Column({ type: 'integer', nullable: true })
  risk_score: number | null;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  decision_at: Date | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  submitted_at: Date;

  @ManyToOne(() => SmarttrackOperatorEntity)
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: SmarttrackOperatorEntity;
}
