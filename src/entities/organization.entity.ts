import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrgStatus } from '@enums/org-status.enum';
import { UserEntity } from './user.entity';
import { ProgramEntity } from './program.entity';
import { IndividualEntity } from './individual.entity';

@Entity('organizations')
@Index('idx_organizations_npi', ['npi'], { unique: true })
@Index('idx_organizations_ein', ['ein'])
@Index('idx_organizations_status', ['status'])
export class OrganizationEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  legal_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dba: string | null;

  @Column({ type: 'varchar', length: 10, unique: true })
  npi: string;

  @Column({ type: 'varchar', length: 10 })
  ein: string;

  @Column({ type: 'enum', enum: OrgStatus, default: OrgStatus.PENDING })
  status: OrgStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  plan_tier: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  schema_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line1: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line2: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  zip: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  taxonomy_code: string | null;

  @Column({ type: 'date', nullable: true })
  go_live_date: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  terminated_at: Date | null;

  @OneToMany(() => UserEntity, (user) => user.organization)
  users: UserEntity[];

  @OneToMany(() => ProgramEntity, (program) => program.organization)
  programs: ProgramEntity[];

  @OneToMany(() => IndividualEntity, (individual) => individual.organization)
  individuals: IndividualEntity[];
}
