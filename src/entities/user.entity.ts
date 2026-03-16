import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { AgencyRole } from '@enums/role.enum';
import { UserStatus } from '@enums/user-status.enum';
import { MfaType } from '@enums/mfa-type.enum';
import { OrganizationEntity } from './organization.entity';

@Entity('users')
@Index('idx_users_email', ['email'], { unique: true })
@Index('idx_users_role', ['role'])
@Index('idx_users_status', ['status'])
export class UserEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  org_id: string | null;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: AgencyRole, default: AgencyRole.DSP })
  role: AgencyRole;

  @Column({ type: 'jsonb', default: '{}' })
  sub_permissions: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'varchar', length: 6, nullable: true })
  otp_code: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otp_expires_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reset_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reset_token_expires_at: Date | null;

  @Column({ type: 'boolean', default: false })
  mfa_enabled: boolean;

  @Column({ type: 'enum', enum: MfaType, default: MfaType.NONE })
  mfa_type: MfaType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfa_secret: string | null;

  @Column({ type: 'varchar', length: 6, nullable: true })
  mfa_otp_code: string | null;

  @Column({ type: 'timestamp', nullable: true })
  mfa_otp_expires_at: Date | null;

  @Column({ type: 'jsonb', default: '[]' })
  mfa_backup_codes: { hash: string; used: boolean }[];

  @Column({ type: 'integer', default: 0 })
  mfa_failed_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  mfa_locked_until: Date | null;

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

  @ManyToOne(() => OrganizationEntity, (org) => org.users, { nullable: true })
  @JoinColumn({ name: 'org_id' })
  organization: OrganizationEntity | null;

  @ManyToOne(() => UserEntity, (user) => user.subordinates, { nullable: true })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: UserEntity | null;

  @OneToMany(() => UserEntity, (user) => user.supervisor)
  subordinates: UserEntity[];
}
