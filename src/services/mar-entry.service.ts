import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MarEntryDal } from '@dals/mar-entry.dal';
import { EncryptionService } from './encryption.service';
import { AuditLogService } from './audit-log.service';
import { type CreateMarEntryDto } from '@dtos/create-mar-entry.dto';
import { type MarEntryEntity } from '@entities/mar-entry.entity';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class MarEntryService {
  private readonly logger = new Logger(MarEntryService.name);

  constructor(
    private readonly marEntryDal: MarEntryDal,
    private readonly encryptionService: EncryptionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private encryptPhiFields(
    dto: Partial<Pick<CreateMarEntryDto, 'drug_name' | 'dose' | 'route'>>,
  ): Record<string, string | null | undefined> {
    const result: Record<string, string | null | undefined> = {};

    if (dto.drug_name !== undefined) {
      result.drug_name = dto.drug_name
        ? this.encryptionService.encrypt(dto.drug_name)
        : null;
    }
    if (dto.dose !== undefined) {
      result.dose = dto.dose
        ? this.encryptionService.encrypt(dto.dose)
        : null;
    }
    if (dto.route !== undefined) {
      result.route = dto.route
        ? this.encryptionService.encrypt(dto.route)
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
        `Failed to decrypt field "${fieldName}" for MAR entry — returning null`,
      );
      return null;
    }
  }

  private decryptFields(entry: MarEntryEntity): MarEntryEntity {
    return {
      ...entry,
      drug_name: this.decryptField(entry.drug_name, 'drug_name') ?? '',
      dose: this.decryptField(entry.dose, 'dose') ?? '',
      route: this.decryptField(entry.route, 'route'),
    };
  }

  async create(
    dto: CreateMarEntryDto,
    orgId: string,
    administeredBy: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const encrypted = this.encryptPhiFields(dto);

    const entry = await this.marEntryDal.create({
      createPayload: {
        org_id: orgId,
        individual_id: dto.individual_id,
        administered_by: administeredBy,
        drug_name: encrypted.drug_name ?? '',
        dose: encrypted.dose ?? '',
        route: encrypted.route ?? null,
        scheduled_time: new Date(dto.scheduled_time),
        administered_time: dto.administered_time
          ? new Date(dto.administered_time)
          : null,
        result: dto.result,
        notes: dto.notes ?? null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: administeredBy,
      user_role: userRole,
      action: 'MAR_ENTRY_CREATED',
      action_type: 'CREATE',
      table_name: 'mar_entries',
      record_id: entry.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(entry);
  }

  async listByIndividual(
    individualId: string,
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const result = await this.marEntryDal.find({
      findOptions: {
        individual_id: individualId,
        org_id: orgId,
      } as never,
      paginationPayload: { page, limit },
      order: { scheduled_time: 'DESC' } as never,
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
    const entry = await this.marEntryDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!entry) {
      throw new NotFoundException();
    }

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'MAR_ENTRY_ACCESSED',
      action_type: 'READ',
      table_name: 'mar_entries',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(entry);
  }
}
