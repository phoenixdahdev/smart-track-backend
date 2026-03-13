import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { IndividualEntity } from './individual.entity';
import { PayerConfigEntity } from './payer-config.entity';

@Entity('individual_payer_coverages')
@Unique(['org_id', 'individual_id', 'payer_config_id', 'coverage_start'])
@Index(['individual_id'])
export class IndividualPayerCoverageEntity extends TenantBaseEntity {
  @Column('uuid')
  individual_id: string;

  @Column('uuid')
  payer_config_id: string;

  @Column({ type: 'varchar', length: 50 })
  subscriber_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  member_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  group_number: string | null;

  @Column({ type: 'varchar', length: 20, default: 'SELF' })
  relationship: string;

  @Column({ type: 'date' })
  coverage_start: string;

  @Column({ type: 'date', nullable: true })
  coverage_end: string | null;

  @Column({ type: 'integer', default: 1 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;

  @ManyToOne(() => PayerConfigEntity)
  @JoinColumn({ name: 'payer_config_id' })
  payer_config: PayerConfigEntity;
}
