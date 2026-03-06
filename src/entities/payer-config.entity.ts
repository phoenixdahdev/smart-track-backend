import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { GlobalPayerEntity } from './global-payer.entity';

@Entity('payer_config')
@Unique(['org_id', 'payer_id_edi'])
export class PayerConfigEntity extends TenantBaseEntity {
  @Column('uuid')
  global_payer_id: string;

  @Column({ type: 'varchar', length: 255 })
  payer_name: string;

  @Column({ type: 'varchar', length: 50 })
  payer_id_edi: string;

  @Column({ type: 'jsonb', default: '{}' })
  clearinghouse_routing: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, any>;

  @ManyToOne(() => GlobalPayerEntity)
  @JoinColumn({ name: 'global_payer_id' })
  global_payer: GlobalPayerEntity;
}
