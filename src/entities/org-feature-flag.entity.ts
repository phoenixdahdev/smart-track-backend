import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('org_feature_flags')
@Unique(['org_id', 'flag_name'])
export class OrgFeatureFlagEntity extends BaseEntity {
  @Column('uuid')
  org_id: string;

  @Column({ type: 'varchar', length: 100 })
  flag_name: string;

  @Column({ type: 'jsonb', default: 'false' })
  value: any;

  @Column({ type: 'uuid', nullable: true })
  set_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  set_at: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'org_id' })
  organization: OrganizationEntity;
}
