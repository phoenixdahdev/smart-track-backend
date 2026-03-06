import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { UserEntity } from './user.entity';
import { IndividualEntity } from './individual.entity';
import { ProgramEntity } from './program.entity';

@Entity('staff_assignments')
export class StaffAssignmentEntity extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  staff_id: string;

  @Column({ type: 'uuid' })
  individual_id: string;

  @Column({ type: 'uuid' })
  program_id: string;

  @Column({ type: 'date' })
  effective_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'staff_id' })
  staff: UserEntity;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;

  @ManyToOne(() => ProgramEntity, (program) => program.staff_assignments)
  @JoinColumn({ name: 'program_id' })
  program: ProgramEntity;
}
