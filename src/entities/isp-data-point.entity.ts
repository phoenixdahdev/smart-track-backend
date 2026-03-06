import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { IspGoalEntity } from './isp-goal.entity';
import { ServiceRecordEntity } from './service-record.entity';
import { UserEntity } from './user.entity';

@Entity('isp_data_points')
export class IspDataPointEntity extends TenantBaseEntity {
  @Column('uuid')
  goal_id: string;

  @Column({ type: 'uuid', nullable: true })
  service_record_id: string | null;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  @Column({ type: 'timestamp' })
  recorded_at: Date;

  @Column('uuid')
  recorded_by: string;

  @ManyToOne(() => IspGoalEntity)
  @JoinColumn({ name: 'goal_id' })
  goal: IspGoalEntity;

  @ManyToOne(() => ServiceRecordEntity)
  @JoinColumn({ name: 'service_record_id' })
  service_record: ServiceRecordEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'recorded_by' })
  recorder: UserEntity;
}
