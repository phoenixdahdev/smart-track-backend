import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DailyNoteDal } from '@dals/daily-note.dal';
import { ServiceRecordDal } from '@dals/service-record.dal';
import { EncryptionService } from './encryption.service';
import { AuditLogService } from './audit-log.service';
import { type CreateDailyNoteDto } from '@dtos/create-daily-note.dto';
import { type UpdateDailyNoteDto } from '@dtos/update-daily-note.dto';
import { type DailyNoteEntity } from '@entities/daily-note.entity';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';

@Injectable()
export class DailyNoteService {
  private readonly logger = new Logger(DailyNoteService.name);

  constructor(
    private readonly dailyNoteDal: DailyNoteDal,
    private readonly serviceRecordDal: ServiceRecordDal,
    private readonly encryptionService: EncryptionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private encryptPhiFields(
    dto: Partial<Pick<CreateDailyNoteDto, 'content' | 'observations'>>,
  ): Record<string, string | null | undefined> {
    const result: Record<string, string | null | undefined> = {};

    if (dto.content !== undefined) {
      result.content = dto.content
        ? this.encryptionService.encrypt(dto.content)
        : null;
    }
    if (dto.observations !== undefined) {
      result.observations = dto.observations
        ? this.encryptionService.encrypt(dto.observations)
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
        `Failed to decrypt field "${fieldName}" for daily note — returning null`,
      );
      return null;
    }
  }

  private decryptFields(note: DailyNoteEntity): DailyNoteEntity {
    return {
      ...note,
      content: this.decryptField(note.content, 'content') ?? '',
      observations: this.decryptField(note.observations, 'observations'),
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
        'Cannot modify notes on an approved service record',
      );
    }

    return record;
  }

  async create(
    serviceRecordId: string,
    dto: CreateDailyNoteDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    await this.validateServiceRecord(serviceRecordId, orgId, userId, true);

    const encrypted = this.encryptPhiFields(dto);

    const note = await this.dailyNoteDal.create({
      createPayload: {
        org_id: orgId,
        service_record_id: serviceRecordId,
        content: encrypted.content ?? '',
        observations: encrypted.observations ?? null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'DAILY_NOTE_CREATED',
      action_type: 'CREATE',
      table_name: 'daily_notes',
      record_id: note.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(note);
  }

  async findByServiceRecord(
    serviceRecordId: string,
    orgId: string,
  ) {
    const result = await this.dailyNoteDal.find({
      findOptions: {
        service_record_id: serviceRecordId,
        org_id: orgId,
      } as never,
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return {
      payload: result.payload.map((n) => this.decryptFields(n)),
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
    const note = await this.dailyNoteDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!note) {
      throw new NotFoundException();
    }

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'DAILY_NOTE_ACCESSED',
      action_type: 'READ',
      table_name: 'daily_notes',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(note);
  }

  async update(
    id: string,
    serviceRecordId: string,
    orgId: string,
    dto: UpdateDailyNoteDto,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    await this.validateServiceRecord(serviceRecordId, orgId, userId, true);

    const note = await this.dailyNoteDal.get({
      identifierOptions: {
        id,
        org_id: orgId,
        service_record_id: serviceRecordId,
      } as never,
    });

    if (!note) {
      throw new NotFoundException();
    }

    const encrypted = this.encryptPhiFields(dto);
    const updatePayload: Record<string, unknown> = {};
    if (encrypted.content !== undefined) updatePayload.content = encrypted.content;
    if (encrypted.observations !== undefined)
      updatePayload.observations = encrypted.observations;

    const updated = await this.dailyNoteDal.update({
      identifierOptions: { id } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'DAILY_NOTE_UPDATED',
      action_type: 'UPDATE',
      table_name: 'daily_notes',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated ? this.decryptFields(updated) : null;
  }
}
