import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { RemittanceStatus } from '@enums/remittance-status.enum';
import { PayerConfigEntity } from './payer-config.entity';

@Entity('remittances')
@Unique(['org_id', 'interchange_control_num'])
@Index(['payer_config_id'])
@Index(['payment_date'])
@Index(['eft_trace_number'])
export class RemittanceEntity extends TenantBaseEntity {
  @Column('uuid')
  payer_config_id: string;

  @Column({ type: 'date' })
  payment_date: string;

  @Column({ type: 'varchar', length: 30 })
  eft_trace_number: string;

  @Column({ type: 'bigint' })
  eft_total_cents: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  interchange_control_num: string | null;

  @Column({ type: 'enum', enum: RemittanceStatus, default: RemittanceStatus.RECEIVED })
  status: RemittanceStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  raw_file_s3_key: string | null;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  received_at: Date;

  @ManyToOne(() => PayerConfigEntity)
  @JoinColumn({ name: 'payer_config_id' })
  payer_config: PayerConfigEntity;
}
