import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PlatformRole } from '@enums/role.enum';
import { MfaType } from '@enums/mfa-type.enum';

@Entity('smarttrack_operators')
@Index(['role'])
export class SmarttrackOperatorEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: PlatformRole })
  role: PlatformRole;

  @Column({ type: 'enum', enum: MfaType, default: MfaType.NONE })
  mfa_type: MfaType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfa_device_id: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date | null;
}
