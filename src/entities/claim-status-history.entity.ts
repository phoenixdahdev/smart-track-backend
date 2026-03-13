import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { ClaimStatus } from '@enums/claim-status.enum';
import { ClaimEntity } from './claim.entity';
import { UserEntity } from './user.entity';

@Entity('claim_status_history')
@Index(['claim_id'])
export class ClaimStatusHistoryEntity extends TenantBaseEntity {
  @Column('uuid')
  claim_id: string;

  @Column({ type: 'enum', enum: ClaimStatus, nullable: true })
  from_status: ClaimStatus | null;

  @Column({ type: 'enum', enum: ClaimStatus })
  to_status: ClaimStatus;

  @Column({ type: 'uuid', nullable: true })
  changed_by: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any> | null;

  @ManyToOne(() => ClaimEntity)
  @JoinColumn({ name: 'claim_id' })
  claim: ClaimEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'changed_by' })
  changed_by_user: UserEntity;
}
