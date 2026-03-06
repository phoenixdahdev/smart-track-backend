import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('global_service_codes')
@Index(['code_type'])
@Index(['status'])
export class GlobalServiceCodeEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column('text')
  description: string;

  @Column({ type: 'varchar', length: 20 })
  code_type: string;

  @Column({ type: 'jsonb', default: '[]' })
  valid_states: string[];

  @Column({ type: 'varchar', length: 20 })
  billing_unit: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  deprecated_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;
}
