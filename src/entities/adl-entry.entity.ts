import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { AssistanceLevel } from '@enums/assistance-level.enum';
import { ServiceRecordEntity } from './service-record.entity';
import { IndividualEntity } from './individual.entity';
import { UserEntity } from './user.entity';
import { AdlCategoryEntity } from './adl-category.entity';

@Entity('adl_entries')
@Index('idx_adl_entries_service_record_id', ['service_record_id'])
@Index('idx_adl_entries_individual_id', ['individual_id'])
export class AdlEntryEntity extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  service_record_id: string;

  @Column({ type: 'uuid' })
  individual_id: string;

  @Column({ type: 'uuid' })
  staff_id: string;

  @Column({ type: 'uuid' })
  adl_category_id: string;

  @Column({
    type: 'enum',
    enum: AssistanceLevel,
  })
  assistance_level: AssistanceLevel;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamp', default: () => 'now()' })
  recorded_at: Date;

  @ManyToOne(() => ServiceRecordEntity)
  @JoinColumn({ name: 'service_record_id' })
  service_record: ServiceRecordEntity;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'staff_id' })
  staff: UserEntity;

  @ManyToOne(() => AdlCategoryEntity)
  @JoinColumn({ name: 'adl_category_id' })
  adl_category: AdlCategoryEntity;
}
