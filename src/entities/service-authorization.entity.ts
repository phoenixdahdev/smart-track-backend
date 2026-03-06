import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { AuthorizationStatus } from '@enums/authorization-status.enum';
import { UnitType } from '@enums/unit-type.enum';
import { IndividualEntity } from './individual.entity';
import { PayerConfigEntity } from './payer-config.entity';
import { ServiceCodeEntity } from './service-code.entity';
import { UserEntity } from './user.entity';

@Entity('service_authorizations')
@Index(['individual_id'])
@Index(['status'])
@Index(['end_date'])
export class ServiceAuthorizationEntity extends TenantBaseEntity {
  @Column('uuid')
  individual_id: string;

  @Column('uuid')
  payer_config_id: string;

  @Column('uuid')
  service_code_id: string;

  @Column({ type: 'varchar', length: 50 })
  auth_number: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  units_authorized: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  units_used: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  units_pending: number;

  @Column({ type: 'enum', enum: UnitType })
  unit_type: UnitType;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  rendering_provider_npi: string | null;

  @Column({ type: 'enum', enum: AuthorizationStatus, default: AuthorizationStatus.ACTIVE })
  status: AuthorizationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;

  @ManyToOne(() => PayerConfigEntity)
  @JoinColumn({ name: 'payer_config_id' })
  payer_config: PayerConfigEntity;

  @ManyToOne(() => ServiceCodeEntity)
  @JoinColumn({ name: 'service_code_id' })
  service_code: ServiceCodeEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;
}
