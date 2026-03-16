import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';

@Entity('adl_categories')
@Index('idx_adl_categories_org_id', ['org_id'])
export class AdlCategoryEntity extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 10 })
  category_type: string;

  @Column({ type: 'integer', default: 0 })
  display_order: number;

  @Column({ type: 'boolean', default: false })
  is_standard: boolean;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
