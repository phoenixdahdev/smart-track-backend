import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { ServiceRecordEntity } from './service-record.entity';

@Entity('daily_notes')
export class DailyNoteEntity extends TenantBaseEntity {
  @Column('uuid')
  service_record_id: string;

  @Column('text')
  content: string; // ENCRYPTED at app layer

  @Column({ type: 'text', nullable: true })
  observations: string | null; // ENCRYPTED

  @Column({ type: 'timestamp', nullable: true })
  submitted_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @ManyToOne(() => ServiceRecordEntity)
  @JoinColumn({ name: 'service_record_id' })
  service_record: ServiceRecordEntity;
}
