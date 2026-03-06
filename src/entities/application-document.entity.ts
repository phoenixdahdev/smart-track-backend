import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { SignupApplicationEntity } from './signup-application.entity';
import { SmarttrackOperatorEntity } from './smarttrack-operator.entity';

@Entity('application_documents')
export class ApplicationDocumentEntity extends BaseEntity {
  @Column('uuid')
  application_id: string;

  @Column({ type: 'varchar', length: 50 })
  doc_type: string;

  @Column({ type: 'varchar', length: 500 })
  s3_key: string;

  @Column({ type: 'varchar', length: 255 })
  s3_bucket: string;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'uuid', nullable: true })
  verified_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => SignupApplicationEntity)
  @JoinColumn({ name: 'application_id' })
  application: SignupApplicationEntity;

  @ManyToOne(() => SmarttrackOperatorEntity)
  @JoinColumn({ name: 'verified_by' })
  verifier: SmarttrackOperatorEntity;
}
