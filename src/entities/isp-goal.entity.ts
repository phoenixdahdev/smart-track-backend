import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { IndividualEntity } from './individual.entity';

@Entity('isp_goals')
export class IspGoalEntity extends TenantBaseEntity {
  @Column('uuid')
  individual_id: string;

  @Column('text')
  description: string; // ENCRYPTED

  @Column({ type: 'varchar', length: 255, nullable: true })
  target: string | null;

  @Column({ type: 'date' })
  effective_start: string;

  @Column({ type: 'date', nullable: true })
  effective_end: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;
}
