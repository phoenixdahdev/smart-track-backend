import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { IndividualEntity } from './individual.entity';
import { UserEntity } from './user.entity';

@Entity('mar_entries')
export class MarEntryEntity extends TenantBaseEntity {
  @Column('uuid')
  individual_id: string;

  @Column('uuid')
  administered_by: string;

  @Column('text')
  drug_name: string; // ENCRYPTED

  @Column('text')
  dose: string; // ENCRYPTED

  @Column({ type: 'text', nullable: true })
  route: string | null; // ENCRYPTED

  @Column({ type: 'timestamp' })
  scheduled_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  administered_time: Date | null;

  @Column({ type: 'varchar', length: 50 })
  result: string; // GIVEN, REFUSED, HELD, NOT_AVAILABLE

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'administered_by' })
  administrator: UserEntity;
}
