import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { ShiftStatus } from '@enums/shift-status.enum';
import { UserEntity } from './user.entity';
import { IndividualEntity } from './individual.entity';
import { SiteEntity } from './site.entity';
import { ProgramEntity } from './program.entity';

@Entity('shifts')
@Index(['staff_id'])
@Index(['shift_date'])
@Index(['status'])
@Index('idx_shifts_org_staff', ['org_id', 'staff_id'])
@Index('idx_shifts_org_date', ['org_id', 'shift_date'])
export class ShiftEntity extends TenantBaseEntity {
  @Column('uuid')
  staff_id: string;

  @Column('uuid')
  individual_id: string;

  @Column({ type: 'uuid', nullable: true })
  site_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  program_id: string | null;

  @Column({ type: 'date' })
  shift_date: string;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'enum', enum: ShiftStatus, default: ShiftStatus.DRAFT })
  status: ShiftStatus;

  @Column('uuid')
  created_by: string;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  responded_at: Date | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'staff_id' })
  staff: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @ManyToOne(() => ProgramEntity)
  @JoinColumn({ name: 'program_id' })
  program: ProgramEntity;
}
