import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AdlEntryDal } from '@dals/adl-entry.dal';
import { ServiceRecordDal } from '@dals/service-record.dal';
import { AdlCategoryDal } from '@dals/adl-category.dal';
import { EncryptionService } from './encryption.service';
import { AuditLogService } from './audit-log.service';
import { type CreateAdlEntryDto } from '@dtos/create-adl-entry.dto';
import { type UpdateAdlEntryDto } from '@dtos/update-adl-entry.dto';
import { type AdlEntryQueryDto } from '@dtos/adl-entry-query.dto';
import { type AdlEntryEntity } from '@entities/adl-entry.entity';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

@Injectable()
export class AdlEntryService {
  private readonly logger = new Logger(AdlEntryService.name);

  constructor(
    private readonly adlEntryDal: AdlEntryDal,
    private readonly serviceRecordDal: ServiceRecordDal,
    private readonly adlCategoryDal: AdlCategoryDal,
    private readonly encryptionService: EncryptionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private encryptPhiFields(
    dto: Partial<Pick<CreateAdlEntryDto, 'notes'>>,
  ): Record<string, string | null | undefined> {
    const result: Record<string, string | null | undefined> = {};

    if (dto.notes !== undefined) {
      result.notes = dto.notes
        ? this.encryptionService.encrypt(dto.notes)
        : null;
    }

    return result;
  }

  private decryptField(
    value: string | null | undefined,
    fieldName: string,
  ): string | null {
    if (!value) return null;
    try {
      return this.encryptionService.decrypt(value);
    } catch {
      this.logger.warn(
        `Failed to decrypt field "${fieldName}" for ADL entry — returning null`,
      );
      return null;
    }
  }

  private decryptFields(entry: AdlEntryEntity): AdlEntryEntity {
    return {
      ...entry,
      notes: this.decryptField(entry.notes, 'notes'),
    };
  }

  private async validateServiceRecord(
    serviceRecordId: string,
    orgId: string,
    staffId: string,
    requireEditable = false,
  ) {
    const record = await this.serviceRecordDal.get({
      identifierOptions: {
        id: serviceRecordId,
        org_id: orgId,
        staff_id: staffId,
      } as never,
    });

    if (!record) {
      throw new NotFoundException('Service record not found');
    }

    if (requireEditable && record.status === ServiceRecordStatus.APPROVED) {
      throw new BadRequestException(
        'Cannot modify ADL entries on an approved service record',
      );
    }

    return record;
  }

  async create(
    dto: CreateAdlEntryDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    await this.validateServiceRecord(dto.service_record_id, orgId, userId, true);

    const category = await this.adlCategoryDal.get({
      identifierOptions: {
        id: dto.adl_category_id,
        org_id: orgId,
        active: true,
      } as never,
    });

    if (!category) {
      throw new NotFoundException('ADL category not found');
    }

    const encrypted = this.encryptPhiFields(dto);

    const entry = await this.adlEntryDal.create({
      createPayload: {
        org_id: orgId,
        service_record_id: dto.service_record_id,
        individual_id: dto.individual_id,
        staff_id: userId,
        adl_category_id: dto.adl_category_id,
        assistance_level: dto.assistance_level,
        notes: encrypted.notes ?? null,
        recorded_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'ADL_ENTRY_CREATED',
      action_type: 'CREATE',
      table_name: 'adl_entries',
      record_id: entry.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(entry);
  }

  async bulkCreate(
    entries: CreateAdlEntryDto[],
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    if (!entries.length) {
      throw new BadRequestException('At least one entry is required');
    }

    const serviceRecordId = entries[0].service_record_id;
    const allSameSr = entries.every(
      (e) => e.service_record_id === serviceRecordId,
    );
    if (!allSameSr) {
      throw new BadRequestException(
        'All entries must belong to the same service record',
      );
    }

    await this.validateServiceRecord(serviceRecordId, orgId, userId, true);

    const created: AdlEntryEntity[] = [];
    for (const dto of entries) {
      const category = await this.adlCategoryDal.get({
        identifierOptions: {
          id: dto.adl_category_id,
          org_id: orgId,
          active: true,
        } as never,
      });

      if (!category) {
        throw new NotFoundException(
          `ADL category not found: ${dto.adl_category_id}`,
        );
      }

      const encrypted = this.encryptPhiFields(dto);

      const entry = await this.adlEntryDal.create({
        createPayload: {
          org_id: orgId,
          service_record_id: dto.service_record_id,
          individual_id: dto.individual_id,
          staff_id: userId,
          adl_category_id: dto.adl_category_id,
          assistance_level: dto.assistance_level,
          notes: encrypted.notes ?? null,
          recorded_at: new Date(),
        } as never,
        transactionOptions: { useTransaction: false },
      });

      await this.auditLogService.logAgencyAction({
        org_id: orgId,
        user_id: userId,
        user_role: userRole,
        action: 'ADL_ENTRY_CREATED',
        action_type: 'CREATE',
        table_name: 'adl_entries',
        record_id: entry.id,
        ip_address: ip,
        user_agent: userAgent,
      });

      created.push(this.decryptFields(entry));
    }

    return created;
  }

  async findByServiceRecord(
    serviceRecordId: string,
    orgId: string,
  ) {
    const result = await this.adlEntryDal.find({
      findOptions: {
        service_record_id: serviceRecordId,
        org_id: orgId,
      } as never,
      order: { recorded_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return {
      payload: result.payload.map((e) => this.decryptFields(e)),
      paginationMeta: result.paginationMeta,
    };
  }

  async findById(
    id: string,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const entry = await this.adlEntryDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!entry) {
      throw new NotFoundException();
    }

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'ADL_ENTRY_ACCESSED',
      action_type: 'READ',
      table_name: 'adl_entries',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(entry);
  }

  async update(
    id: string,
    dto: UpdateAdlEntryDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const entry = await this.adlEntryDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!entry) {
      throw new NotFoundException();
    }

    await this.validateServiceRecord(
      entry.service_record_id,
      orgId,
      userId,
      true,
    );

    const updatePayload: Record<string, unknown> = {};
    if (dto.assistance_level !== undefined) {
      updatePayload.assistance_level = dto.assistance_level;
    }
    if (dto.notes !== undefined) {
      const encrypted = this.encryptPhiFields(dto);
      updatePayload.notes = encrypted.notes;
    }

    const updated = await this.adlEntryDal.update({
      identifierOptions: { id } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'ADL_ENTRY_UPDATED',
      action_type: 'UPDATE',
      table_name: 'adl_entries',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated ? this.decryptFields(updated) : null;
  }

  async findByIndividual(
    query: AdlEntryQueryDto,
    orgId: string,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const findOptions: Record<string, unknown> = {
      org_id: orgId,
    };

    if (query.individual_id) {
      findOptions.individual_id = query.individual_id;
    }
    if (query.adl_category_id) {
      findOptions.adl_category_id = query.adl_category_id;
    }

    if (query.date_from && query.date_to) {
      findOptions.recorded_at = Between(
        new Date(query.date_from),
        new Date(`${query.date_to}T23:59:59.999Z`),
      );
    } else if (query.date_from) {
      findOptions.recorded_at = MoreThanOrEqual(new Date(query.date_from));
    } else if (query.date_to) {
      findOptions.recorded_at = LessThanOrEqual(
        new Date(`${query.date_to}T23:59:59.999Z`),
      );
    }

    const result = await this.adlEntryDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { recorded_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return {
      payload: result.payload.map((e) => this.decryptFields(e)),
      paginationMeta: result.paginationMeta,
    };
  }

  async getAdlSummary(individualId: string, orgId: string) {
    const result = await this.adlEntryDal.find({
      findOptions: {
        individual_id: individualId,
        org_id: orgId,
      } as never,
      order: { recorded_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const latestByCategory = new Map<
      string,
      { adl_category_id: string; assistance_level: string; recorded_at: Date }
    >();

    for (const entry of result.payload) {
      if (!latestByCategory.has(entry.adl_category_id)) {
        latestByCategory.set(entry.adl_category_id, {
          adl_category_id: entry.adl_category_id,
          assistance_level: entry.assistance_level,
          recorded_at: entry.recorded_at,
        });
      }
    }

    return Array.from(latestByCategory.values());
  }
}
