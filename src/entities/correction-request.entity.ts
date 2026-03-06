import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { CorrectionStatus } from '@enums/correction-status.enum';
import { ServiceRecordEntity } from './service-record.entity';
import { UserEntity } from './user.entity';

@Entity('correction_requests')
export class CorrectionRequestEntity extends TenantBaseEntity {
  @Column('uuid')
  service_record_id: string;

  @Column('uuid')
  requested_by: string;

  @Column('text')
  requested_changes: string;

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

  @Column({ type: 'text', nullable: true })
  reviewer_notes: string | null;

  @ManyToOne(() => ServiceRecordEntity)
  @JoinColumn({ name: 'service_record_id' })
  service_record: ServiceRecordEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'requested_by' })
  requester: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: UserEntity;
}
