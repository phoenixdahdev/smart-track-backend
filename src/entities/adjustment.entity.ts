import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { AdjustmentType } from '@enums/adjustment-type.enum';
import { ClaimLineEntity } from './claim-line.entity';
import { PaymentPostEntity } from './payment-post.entity';

@Entity('adjustments')
export class AdjustmentEntity extends TenantBaseEntity {
  @Column('uuid')
  claim_line_id: string;

  @Column({ type: 'uuid', nullable: true })
  payment_post_id: string | null;

  @Column({ type: 'enum', enum: AdjustmentType })
  type: AdjustmentType;

  @Column({ type: 'varchar', length: 50 })
  reason_code: string;

  @Column({ type: 'bigint' })
  adjustment_amount_cents: number;

  @ManyToOne(() => ClaimLineEntity)
  @JoinColumn({ name: 'claim_line_id' })
  claim_line: ClaimLineEntity;

  @ManyToOne(() => PaymentPostEntity)
  @JoinColumn({ name: 'payment_post_id' })
  payment_post: PaymentPostEntity;
}
