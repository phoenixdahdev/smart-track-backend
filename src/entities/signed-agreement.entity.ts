import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AgreementType } from '@enums/agreement-type.enum';
import { OrganizationEntity } from './organization.entity';

@Entity('signed_agreements')
export class SignedAgreementEntity extends BaseEntity {
  @Column('uuid')
  org_id: string;

  @Column({ type: 'enum', enum: AgreementType })
  agreement_type: AgreementType;

  @Column({ type: 'varchar', length: 20 })
  version: string;

  @Column({ type: 'varchar', length: 255 })
  signed_by_name: string;

  @Column({ type: 'timestamp' })
  signed_at: Date;

  @Column({ type: 'varchar', length: 45 })
  ip_address: string;

  @Column({ type: 'varchar', length: 500 })
  pdf_s3_key: string;

  @Column({ type: 'varchar', length: 255 })
  pdf_s3_bucket: string;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'org_id' })
  organization: OrganizationEntity;
}
