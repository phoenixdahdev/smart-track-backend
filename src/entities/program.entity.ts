import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { OrganizationEntity } from './organization.entity';
import { SiteEntity } from './site.entity';
import { StaffAssignmentEntity } from './staff-assignment.entity';

@Entity('programs')
export class ProgramEntity extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  type: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  billing_type: string | null;

  @ManyToOne(() => OrganizationEntity, (org) => org.programs)
  @JoinColumn({ name: 'org_id' })
  organization: OrganizationEntity;

  @OneToMany(() => SiteEntity, (site) => site.program)
  sites: SiteEntity[];

  @OneToMany(() => StaffAssignmentEntity, (assignment) => assignment.program)
  staff_assignments: StaffAssignmentEntity[];
}
