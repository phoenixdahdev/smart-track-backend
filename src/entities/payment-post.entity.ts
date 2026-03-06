import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { MatchingMethod } from '@enums/matching-method.enum';
import { RemittanceEntity } from './remittance.entity';
import { ClaimEntity } from './claim.entity';
import { ClaimLineEntity } from './claim-line.entity';

@Entity('payment_posts')
export class PaymentPostEntity extends TenantBaseEntity {
  @Column('uuid')
  remittance_id: string;

  @Column({ type: 'uuid', nullable: true })
  claim_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  claim_line_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status_code: string | null;

  @Column({ type: 'bigint' })
  billed_cents: number;

  @Column({ type: 'bigint' })
  paid_cents: number;

  @Column({ type: 'bigint', default: 0 })
  patient_responsibility_cents: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payer_claim_control_number: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  matching_confidence: number | null;

  @Column({ type: 'enum', enum: MatchingMethod, nullable: true })
  matching_method: MatchingMethod | null;

  @ManyToOne(() => RemittanceEntity)
  @JoinColumn({ name: 'remittance_id' })
  remittance: RemittanceEntity;

  @ManyToOne(() => ClaimEntity)
  @JoinColumn({ name: 'claim_id' })
  claim: ClaimEntity;

  @ManyToOne(() => ClaimLineEntity)
  @JoinColumn({ name: 'claim_line_id' })
  claim_line: ClaimLineEntity;
}
