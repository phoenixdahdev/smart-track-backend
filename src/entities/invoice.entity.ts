import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InvoiceStatus } from '@enums/invoice-status.enum';
import { OrganizationEntity } from './organization.entity';
import { SubscriptionEntity } from './subscription.entity';

@Entity('invoices')
@Index(['org_id'])
@Index(['status'])
@Index(['due_date'])
export class InvoiceEntity extends BaseEntity {
  @Column('uuid')
  org_id: string;

  @Column('uuid')
  subscription_id: string;

  @Column({ type: 'integer' })
  amount_cents: number;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'date' })
  due_date: string;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_invoice_id: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  pdf_s3_key: string | null;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'org_id' })
  organization: OrganizationEntity;

  @ManyToOne(() => SubscriptionEntity)
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionEntity;
}
