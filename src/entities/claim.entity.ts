import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { ClaimStatus } from '@enums/claim-status.enum';
import { ClaimType } from '@enums/claim-type.enum';
import { ServiceRecordEntity } from './service-record.entity';
import { IndividualEntity } from './individual.entity';
import { PayerConfigEntity } from './payer-config.entity';
import { ServiceAuthorizationEntity } from './service-authorization.entity';
import { UserEntity } from './user.entity';

@Entity('claims')
@Index(['service_record_id'])
@Index(['status'])
@Index(['payer_config_id'])
@Index(['service_date_from'])
@Index('idx_claims_org_status', ['org_id', 'status'])
@Index('idx_claims_org_payer', ['org_id', 'payer_config_id'])
export class ClaimEntity extends TenantBaseEntity {
  @Column('uuid')
  service_record_id: string;

  @Column('uuid')
  individual_id: string;

  @Column('uuid')
  payer_config_id: string;

  @Column({ type: 'enum', enum: ClaimType })
  claim_type: ClaimType;

  @Column({ type: 'varchar', length: 50 })
  subscriber_id: string;

  @Column({ type: 'varchar', length: 10 })
  billing_provider_npi: string;

  @Column({ type: 'varchar', length: 10 })
  billing_provider_ein: string;

  @Column({ type: 'varchar', length: 255 })
  billing_provider_name: string;

  @Column({ type: 'jsonb' })
  billing_provider_address: Record<string, any>;

  @Column({ type: 'date' })
  service_date_from: string;

  @Column({ type: 'date' })
  service_date_through: string;

  @Column({ type: 'varchar', length: 1, default: '1' })
  frequency_code: string;

  @Column({ type: 'varchar', length: 2 })
  place_of_service: string;

  @Column({ type: 'jsonb', default: '[]' })
  diagnosis_codes: string[];

  @Column({ type: 'integer' })
  total_charge_cents: number;

  @Column({ type: 'enum', enum: ClaimStatus, default: ClaimStatus.DRAFT })
  status: ClaimStatus;

  @Column({ type: 'uuid', nullable: true })
  original_claim_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  service_authorization_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @Column({ type: 'jsonb', nullable: true })
  validation_errors: Record<string, any> | null;

  @Column({ type: 'timestamp', nullable: true })
  last_validated_at: Date | null;

  @Column({ type: 'integer', default: 0 })
  paid_amount_cents: number;

  @Column({ type: 'integer', default: 0 })
  patient_responsibility_cents: number;

  @Column({ type: 'integer', default: 0 })
  contractual_adj_cents: number;

  @Column({ type: 'integer', default: 0 })
  balance_cents: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payer_claim_control_number: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  denial_reason_codes: string[];

  @Column({ type: 'timestamp', nullable: true })
  submitted_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @ManyToOne(() => ServiceRecordEntity)
  @JoinColumn({ name: 'service_record_id' })
  service_record: ServiceRecordEntity;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;

  @ManyToOne(() => PayerConfigEntity)
  @JoinColumn({ name: 'payer_config_id' })
  payer_config: PayerConfigEntity;

  @ManyToOne(() => ClaimEntity)
  @JoinColumn({ name: 'original_claim_id' })
  original_claim: ClaimEntity;

  @ManyToOne(() => ServiceAuthorizationEntity)
  @JoinColumn({ name: 'service_authorization_id' })
  service_authorization: ServiceAuthorizationEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;
}
