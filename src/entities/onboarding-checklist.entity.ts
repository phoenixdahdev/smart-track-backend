import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OnboardingStatus } from '@enums/onboarding-status.enum';
import { OrganizationEntity } from './organization.entity';
import { SmarttrackOperatorEntity } from './smarttrack-operator.entity';

@Entity('onboarding_checklists')
export class OnboardingChecklistEntity extends BaseEntity {
  @Column('uuid')
  org_id: string;

  @Column({ type: 'uuid', nullable: true })
  specialist_id: string | null;

  @Column({ type: 'enum', enum: OnboardingStatus, default: OnboardingStatus.NOT_STARTED })
  status: OnboardingStatus;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'org_id' })
  organization: OrganizationEntity;

  @ManyToOne(() => SmarttrackOperatorEntity)
  @JoinColumn({ name: 'specialist_id' })
  specialist: SmarttrackOperatorEntity;
}
