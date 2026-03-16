import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AdlCategoryDal } from '@dals/adl-category.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateAdlCategoryDto } from '@dtos/create-adl-category.dto';
import { type UpdateAdlCategoryDto } from '@dtos/update-adl-category.dto';

const STANDARD_CATEGORIES = [
  { name: 'Bathing', category_type: 'ADL', display_order: 1 },
  { name: 'Dressing', category_type: 'ADL', display_order: 2 },
  { name: 'Eating/Feeding', category_type: 'ADL', display_order: 3 },
  { name: 'Toileting', category_type: 'ADL', display_order: 4 },
  { name: 'Grooming', category_type: 'ADL', display_order: 5 },
  { name: 'Mobility', category_type: 'ADL', display_order: 6 },
  { name: 'Transfers', category_type: 'ADL', display_order: 7 },
  { name: 'Continence', category_type: 'ADL', display_order: 8 },
  { name: 'Communication', category_type: 'IADL', display_order: 9 },
  { name: 'Behavior Management', category_type: 'IADL', display_order: 10 },
  { name: 'Meal Prep', category_type: 'IADL', display_order: 11 },
  { name: 'Housekeeping', category_type: 'IADL', display_order: 12 },
  { name: 'Laundry', category_type: 'IADL', display_order: 13 },
  { name: 'Money Management', category_type: 'IADL', display_order: 14 },
  { name: 'Medication Management', category_type: 'IADL', display_order: 15 },
];

@Injectable()
export class AdlCategoryService {
  private readonly logger = new Logger(AdlCategoryService.name);

  constructor(
    private readonly adlCategoryDal: AdlCategoryDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateAdlCategoryDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const category = await this.adlCategoryDal.create({
      createPayload: {
        org_id: orgId,
        name: dto.name,
        description: dto.description ?? null,
        category_type: dto.category_type,
        display_order: dto.display_order ?? 0,
        is_standard: false,
        active: true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'ADL_CATEGORY_CREATED',
      action_type: 'CREATE',
      table_name: 'adl_categories',
      record_id: category.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return category;
  }

  async findAll(orgId: string) {
    const result = await this.adlCategoryDal.find({
      findOptions: { org_id: orgId, active: true } as never,
      order: { display_order: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return result.payload;
  }

  async findById(id: string, orgId: string) {
    const category = await this.adlCategoryDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!category) {
      throw new NotFoundException('ADL category not found');
    }

    return category;
  }

  async update(
    id: string,
    dto: UpdateAdlCategoryDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const category = await this.adlCategoryDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!category) {
      throw new NotFoundException('ADL category not found');
    }

    const updatePayload: Record<string, unknown> = {};
    if (dto.name !== undefined) updatePayload.name = dto.name;
    if (dto.description !== undefined) updatePayload.description = dto.description;
    if (dto.category_type !== undefined) updatePayload.category_type = dto.category_type;
    if (dto.display_order !== undefined) updatePayload.display_order = dto.display_order;
    if (dto.active !== undefined) updatePayload.active = dto.active;

    const updated = await this.adlCategoryDal.update({
      identifierOptions: { id } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'ADL_CATEGORY_UPDATED',
      action_type: 'UPDATE',
      table_name: 'adl_categories',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async deactivate(
    id: string,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const category = await this.adlCategoryDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!category) {
      throw new NotFoundException('ADL category not found');
    }

    const updated = await this.adlCategoryDal.update({
      identifierOptions: { id } as never,
      updatePayload: { active: false } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'ADL_CATEGORY_DEACTIVATED',
      action_type: 'UPDATE',
      table_name: 'adl_categories',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async seedStandardCategories(orgId: string) {
    const created: Awaited<ReturnType<AdlCategoryDal['create']>>[] = [];

    for (const cat of STANDARD_CATEGORIES) {
      const existing = await this.adlCategoryDal.get({
        identifierOptions: {
          org_id: orgId,
          name: cat.name,
          is_standard: true,
        } as never,
      });

      if (!existing) {
        const category = await this.adlCategoryDal.create({
          createPayload: {
            org_id: orgId,
            name: cat.name,
            description: null,
            category_type: cat.category_type,
            display_order: cat.display_order,
            is_standard: true,
            active: true,
          } as never,
          transactionOptions: { useTransaction: false },
        });
        created.push(category);
      }
    }

    this.logger.log(
      `Seeded ${created.length} standard ADL categories for org ${orgId}`,
    );

    return created;
  }
}
