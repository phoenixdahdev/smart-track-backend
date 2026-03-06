import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { IndividualEntity } from './individual.entity';
import { UserEntity } from './user.entity';

@Entity('behavior_plans')
export class BehaviorPlanEntity extends TenantBaseEntity {
  @Column('uuid')
  individual_id: string;

  @Column('uuid')
  clinician_id: string;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column('text')
  content: string; // ENCRYPTED

  @Column({ type: 'date' })
  effective_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'clinician_id' })
  clinician: UserEntity;
}
