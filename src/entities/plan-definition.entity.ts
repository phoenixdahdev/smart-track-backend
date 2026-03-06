import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('plan_definitions')
export class PlanDefinitionEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  tier_name: string;

  @Column({ type: 'integer' })
  max_individuals: number;

  @Column({ type: 'integer' })
  max_users: number;

  @Column({ type: 'integer' })
  storage_gb: number;

  @Column({ type: 'integer' })
  api_calls_monthly: number;

  @Column({ type: 'jsonb', default: '[]' })
  modules_included: string[];

  @Column({ type: 'integer' })
  price_cents_monthly: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
