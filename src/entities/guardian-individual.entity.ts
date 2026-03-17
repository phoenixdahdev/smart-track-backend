import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { GuardianRelationship } from '@enums/guardian-relationship.enum';
import { UserEntity } from './user.entity';
import { IndividualEntity } from './individual.entity';

@Entity('guardian_individuals')
@Unique(['guardian_id', 'individual_id'])
@Index(['guardian_id'])
@Index(['individual_id'])
export class GuardianIndividualEntity extends TenantBaseEntity {
  @Column('uuid')
  guardian_id: string;

  @Column('uuid')
  individual_id: string;

  @Column({
    type: 'enum',
    enum: GuardianRelationship,
  })
  relationship: GuardianRelationship;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'guardian_id' })
  guardian: UserEntity;

  @ManyToOne(() => IndividualEntity)
  @JoinColumn({ name: 'individual_id' })
  individual: IndividualEntity;
}
