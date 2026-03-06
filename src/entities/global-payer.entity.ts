import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('global_payers')
@Index(['payer_id_edi'])
@Index(['state'])
@Index(['active'])
export class GlobalPayerEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  payer_name: string;

  @Column({ type: 'varchar', length: 50 })
  payer_id_edi: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  program_type: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  clearinghouse_id: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, any>;
}
