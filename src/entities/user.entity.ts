import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { AgencyRole } from '@enums/role.enum';
import { UserStatus } from '@enums/user-status.enum';
import { MfaType } from '@enums/mfa-type.enum';
import { OrganizationEntity } from './organization.entity';

@Entity('users')
@Index('idx_users_email', ['email'])
@Index('idx_users_role', ['role'])
@Index('idx_users_status', ['status'])
@Index('idx_users_auth0_sub', ['auth0_sub'], { unique: true })
export class UserEntity extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: AgencyRole })
  role: AgencyRole;

  @Column({ type: 'jsonb', default: '{}' })
  sub_permissions: Record<string, unknown>;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_INVITE })
  status: UserStatus;

  @Column({ type: 'boolean', default: false })
  mfa_enabled: boolean;

  @Column({ type: 'enum', enum: MfaType, default: MfaType.NONE })
  mfa_type: MfaType;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  auth0_sub: string | null;

  @Column({ type: 'integer', default: 30 })
  session_timeout: number;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  license_info: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  certifications: unknown[];

  @Column({ type: 'uuid', nullable: true })
  supervisor_id: string | null;

  @ManyToOne(() => OrganizationEntity, (org) => org.users)
  @JoinColumn({ name: 'org_id' })
  organization: OrganizationEntity;

  @ManyToOne(() => UserEntity, (user) => user.subordinates, { nullable: true })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: UserEntity | null;

  @OneToMany(() => UserEntity, (user) => user.supervisor)
  subordinates: UserEntity[];
}
