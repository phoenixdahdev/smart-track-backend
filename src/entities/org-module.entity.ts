import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('org_modules')
@Unique(['org_id', 'module_name'])
export class OrgModuleEntity extends BaseEntity {
  @Column('uuid')
  org_id: string;

  @Column({ type: 'varchar', length: 100 })
  module_name: string;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'uuid', nullable: true })
  enabled_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  enabled_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  disabled_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  disabled_at: Date | null;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'org_id' })
  organization: OrganizationEntity;
}
