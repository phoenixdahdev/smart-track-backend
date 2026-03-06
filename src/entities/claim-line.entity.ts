import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { ClaimEntity } from './claim.entity';
import { ServiceCodeEntity } from './service-code.entity';

@Entity('claim_lines')
export class ClaimLineEntity extends TenantBaseEntity {
  @Column('uuid')
  claim_id: string;

  @Column('uuid')
  service_code_id: string;

  @Column({ type: 'varchar', length: 20 })
  procedure_code: string;

  @Column({ type: 'jsonb', default: '[]' })
  modifiers: string[];

  @Column({ type: 'date' })
  service_date: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  units_billed: number;

  @Column({ type: 'integer' })
  charge_cents: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  rendering_provider_npi: string | null;

  @Column({ type: 'varchar', length: 2 })
  place_of_service: string;

  @Column({ type: 'jsonb', default: '[]' })
  diagnosis_pointer: number[];

  @Column({ type: 'integer' })
  line_number: number;

  @ManyToOne(() => ClaimEntity)
  @JoinColumn({ name: 'claim_id' })
  claim: ClaimEntity;

  @ManyToOne(() => ServiceCodeEntity)
  @JoinColumn({ name: 'service_code_id' })
  service_code: ServiceCodeEntity;
}
