import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';
import { ProgramEntity } from './program.entity';

@Entity('sites')
@Index('idx_sites_program_id', ['program_id'])
export class SiteEntity extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  program_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  address_line1: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line2: string | null;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 2 })
  state: string;

  @Column({ type: 'varchar', length: 10 })
  zip: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => ProgramEntity, (program) => program.sites)
  @JoinColumn({ name: 'program_id' })
  program: ProgramEntity;
}
