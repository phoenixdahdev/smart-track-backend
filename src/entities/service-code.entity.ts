import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { GlobalServiceCodeEntity } from './global-service-code.entity';

@Entity('service_codes')
@Unique(['org_id', 'code'])
export class ServiceCodeEntity extends TenantBaseEntity {
  @Column('uuid')
  global_code_id: string;

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  modifiers: string[];

  @Column({ type: 'varchar', length: 20 })
  unit_of_measure: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => GlobalServiceCodeEntity)
  @JoinColumn({ name: 'global_code_id' })
  global_code: GlobalServiceCodeEntity;
}
