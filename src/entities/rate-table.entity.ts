import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { PayerConfigEntity } from './payer-config.entity';
import { ServiceCodeEntity } from './service-code.entity';

@Entity('rate_tables')
@Unique(['payer_config_id', 'service_code_id', 'effective_date'])
export class RateTableEntity extends TenantBaseEntity {
  @Column('uuid')
  payer_config_id: string;

  @Column('uuid')
  service_code_id: string;

  @Column({ type: 'integer' })
  rate_cents: number;

  @Column({ type: 'date' })
  effective_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => PayerConfigEntity)
  @JoinColumn({ name: 'payer_config_id' })
  payer_config: PayerConfigEntity;

  @ManyToOne(() => ServiceCodeEntity)
  @JoinColumn({ name: 'service_code_id' })
  service_code: ServiceCodeEntity;
}
