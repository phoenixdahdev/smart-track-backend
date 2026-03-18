import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity('individuals')
@Index('idx_individuals_org_id', ['org_id'])
export class IndividualEntity extends TenantBaseEntity {
  @Column({ type: 'text' })
  first_name: string;

  @Column({ type: 'text' })
  last_name: string;

  @Column({ type: 'text', nullable: true })
  ssn: string | null;

  @Column({ type: 'text' })
  date_of_birth: string;

  @Column({ type: 'text', nullable: true })
  medicaid_id: string | null;

  @Column({ type: 'text', nullable: true })
  diagnosis_codes: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  emergency_contact: string | null;

  @Column({ type: 'uuid', nullable: true })
  guardian_id: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => OrganizationEntity, (org) => org.individuals)
  @JoinColumn({ name: 'org_id' })
  organization: OrganizationEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'guardian_id' })
  guardian: UserEntity | null;
}
