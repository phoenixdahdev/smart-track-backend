import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { IncidentStatus } from '@enums/incident-status.enum';
import { IndividualEntity } from './individual.entity';
import { UserEntity } from './user.entity';

@Entity('incidents')
export class IncidentEntity extends TenantBaseEntity {
  @Column('uuid')
  individual_id: string;

  @Column('uuid')
  reported_by: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column('text')
  description: string; // ENCRYPTED

  @Column({ type: 'text', nullable: true })
  immediate_action: string | null; // ENCRYPTED

  @Column({ type: 'text', nullable: true })
  supervisor_comments: string | null; // ENCRYPTED

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.DRAFT })
  status: IncidentStatus;

  @Column({ type: 'timestamp' })
  occurred_at: Date;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reported_by' })
  reporter: UserEntity;
}
