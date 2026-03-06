import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { SubscriptionStatus } from '@enums/subscription-status.enum';
import { BillingCycle } from '@enums/billing-cycle.enum';
import { OrganizationEntity } from './organization.entity';

@Entity('subscriptions')
@Index(['org_id'])
@Index(['status'])
export class SubscriptionEntity extends BaseEntity {
  @Column('uuid')
  org_id: string;

  @Column({ type: 'varchar', length: 50 })
  plan_tier: string;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.TRIALING })
  status: SubscriptionStatus;

  @Column({ type: 'enum', enum: BillingCycle, default: BillingCycle.MONTHLY })
  billing_cycle: BillingCycle;

  @Column({ type: 'integer', default: 0 })
  mrr_cents: number;

  @Column({ type: 'timestamp', nullable: true })
  trial_ends_at: Date | null;

  @Column({ type: 'date', nullable: true })
  next_invoice_date: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_subscription_id: string | null;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'org_id' })
  organization: OrganizationEntity;
}
