import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('org_contacts')
export class OrgContactEntity extends BaseEntity {
  @Column('uuid')
  org_id: string;

  @Column({ type: 'varchar', length: 50 })
  contact_type: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'boolean', default: false })
  is_signatory: boolean;

  @Column({ type: 'boolean', default: false })
  is_primary_billing: boolean;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'org_id' })
  organization: OrganizationEntity;
}
