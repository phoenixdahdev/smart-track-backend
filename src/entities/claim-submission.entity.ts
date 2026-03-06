import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { ClaimType } from '@enums/claim-type.enum';
import { ClaimEntity } from './claim.entity';

@Entity('claim_submissions')
export class ClaimSubmissionEntity extends TenantBaseEntity {
  @Column('uuid')
  claim_id: string;

  @Column({ type: 'enum', enum: ClaimType })
  submission_type: ClaimType;

  @Column({ type: 'text', nullable: true })
  edi_content: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  s3_key: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  clearinghouse_id: string | null;

  @Column({ type: 'timestamp' })
  submitted_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  response_received_at: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  response_status: string | null;

  @Column({ type: 'jsonb', nullable: true })
  response_details: Record<string, any> | null;

  @ManyToOne(() => ClaimEntity)
  @JoinColumn({ name: 'claim_id' })
  claim: ClaimEntity;
}
