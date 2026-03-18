import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { PunchType } from '@enums/punch-type.enum';
import { UserEntity } from './user.entity';
import { IndividualEntity } from './individual.entity';
import { ShiftEntity } from './shift.entity';

@Entity('evv_punches')
@Index(['staff_id'])
@Index(['individual_id'])
@Index(['timestamp'])
@Index(['punch_type'])
@Index('idx_evv_punches_org_staff', ['org_id', 'staff_id'])
@Index('idx_evv_punches_org_timestamp', ['org_id', 'timestamp'])
export class EvvPunchEntity extends TenantBaseEntity {
  @Column('uuid')
  staff_id: string;

  @Column('uuid')
  individual_id: string;

  @Column({ type: 'uuid', nullable: true })
  shift_id: string | null;

  @Column({ type: 'enum', enum: PunchType })
  punch_type: PunchType;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gps_latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gps_longitude: number | null;

  @Column({ type: 'boolean', default: false })
  location_confirmed: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  device_id: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'staff_id' })
  staff: UserEntity;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;

  @ManyToOne(() => ShiftEntity)
  @JoinColumn({ name: 'shift_id' })
  shift: ShiftEntity;
}
