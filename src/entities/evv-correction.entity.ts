import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { PunchType } from '@enums/punch-type.enum';
import { CorrectionStatus } from '@enums/correction-status.enum';
import { UserEntity } from './user.entity';
import { ShiftEntity } from './shift.entity';

@Entity('evv_corrections')
export class EvvCorrectionEntity extends TenantBaseEntity {
  @Column('uuid')
  staff_id: string;

  @Column({ type: 'uuid', nullable: true })
  shift_id: string | null;

  @Column({ type: 'enum', enum: PunchType })
  punch_type: PunchType;

  @Column({ type: 'timestamp' })
  requested_time: Date;

  @Column('text')
  reason: string;

  @Column({
    type: 'enum',
    enum: CorrectionStatus,
    default: CorrectionStatus.PENDING,
  })
  status: CorrectionStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at: Date | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'staff_id' })
  staff: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: UserEntity;

  @ManyToOne(() => ShiftEntity)
  @JoinColumn({ name: 'shift_id' })
  shift: ShiftEntity;
}
