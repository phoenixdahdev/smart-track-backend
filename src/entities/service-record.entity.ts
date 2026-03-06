import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import { IndividualEntity } from './individual.entity';
import { UserEntity } from './user.entity';
import { ProgramEntity } from './program.entity';

@Entity('service_records')
@Index(['individual_id'])
@Index(['staff_id'])
@Index(['service_date'])
@Index(['status'])
export class ServiceRecordEntity extends TenantBaseEntity {
  @Column('uuid')
  individual_id: string;

  @Column('uuid')
  staff_id: string;

  @Column({ type: 'uuid', nullable: true })
  program_id: string | null;

  @Column({ type: 'date' })
  service_date: string;

  @Column({ type: 'uuid', nullable: true })
  service_code_id: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  units_delivered: number;

  @Column({
    type: 'enum',
    enum: ServiceRecordStatus,
    default: ServiceRecordStatus.DRAFT,
  })
  status: ServiceRecordStatus;

  @Column({ type: 'timestamp', nullable: true })
  submitted_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  rejected_by: string | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  evv_punch_in_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  evv_punch_out_id: string | null;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'staff_id' })
  staff: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'approved_by' })
  approver: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'rejected_by' })
  rejector: UserEntity;

  @ManyToOne(() => ProgramEntity)
  @JoinColumn({ name: 'program_id' })
  program: ProgramEntity;
}
