import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OnboardingTaskStatus } from '@enums/onboarding-task-status.enum';
import { OnboardingChecklistEntity } from './onboarding-checklist.entity';

@Entity('onboarding_tasks')
export class OnboardingTaskEntity extends BaseEntity {
  @Column('uuid')
  checklist_id: string;

  @Column({ type: 'varchar', length: 100 })
  task_key: string;

  @Column({ type: 'varchar', length: 255 })
  task_name: string;

  @Column({
    type: 'enum',
    enum: OnboardingTaskStatus,
    default: OnboardingTaskStatus.PENDING,
  })
  status: OnboardingTaskStatus;

  @Column({ type: 'uuid', nullable: true })
  completed_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => OnboardingChecklistEntity)
  @JoinColumn({ name: 'checklist_id' })
  checklist: OnboardingChecklistEntity;
}
