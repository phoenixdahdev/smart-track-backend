import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IndividualDal } from '@dals/individual.dal';
import { EncryptionService } from './encryption.service';
import { AuditLogService } from './audit-log.service';
import { type CreateIndividualDto } from '@dtos/create-individual.dto';
import { type UpdateIndividualDto } from '@dtos/update-individual.dto';
import { type IndividualEntity } from '@entities/individual.entity';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class IndividualService {
  private readonly logger = new Logger(IndividualService.name);

  constructor(
    private readonly individualDal: IndividualDal,
    private readonly encryptionService: EncryptionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private encryptPhiFields(
    phiFields: Partial<
      Pick<
        CreateIndividualDto,
        | 'ssn'
        | 'date_of_birth'
        | 'medicaid_id'
        | 'diagnosis_codes'
        | 'address'
        | 'phone'
        | 'emergency_contact'
      >
    >,
  ): Record<string, string | null | undefined> {
    const result: Record<string, string | null | undefined> = {};

    if (phiFields.ssn !== undefined) {
      result.ssn = phiFields.ssn
        ? this.encryptionService.encrypt(phiFields.ssn)
        : null;
    }
    if (phiFields.date_of_birth !== undefined) {
      result.date_of_birth = phiFields.date_of_birth
        ? this.encryptionService.encrypt(phiFields.date_of_birth)
        : null;
    }
    if (phiFields.medicaid_id !== undefined) {
      result.medicaid_id = phiFields.medicaid_id
        ? this.encryptionService.encrypt(phiFields.medicaid_id)
        : null;
    }
    if (phiFields.diagnosis_codes !== undefined) {
      result.diagnosis_codes = phiFields.diagnosis_codes
        ? this.encryptionService.encrypt(phiFields.diagnosis_codes)
        : null;
    }
    if (phiFields.address !== undefined) {
      result.address = phiFields.address
        ? this.encryptionService.encrypt(phiFields.address)
        : null;
    }
    if (phiFields.phone !== undefined) {
      result.phone = phiFields.phone
        ? this.encryptionService.encrypt(phiFields.phone)
        : null;
    }
    if (phiFields.emergency_contact !== undefined) {
      result.emergency_contact = phiFields.emergency_contact
        ? this.encryptionService.encrypt(phiFields.emergency_contact)
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
        `Failed to decrypt field "${fieldName}" for individual record — returning null`,
      );
      return null;
    }
  }

  private decryptFields(individual: IndividualEntity): IndividualEntity {
    return {
      ...individual,
      ssn: this.decryptField(individual.ssn, 'ssn'),
      date_of_birth: this.decryptField(individual.date_of_birth, 'date_of_birth'),
      medicaid_id: this.decryptField(individual.medicaid_id, 'medicaid_id'),
      diagnosis_codes: this.decryptField(
        individual.diagnosis_codes,
        'diagnosis_codes',
      ),
      address: this.decryptField(individual.address, 'address'),
      phone: this.decryptField(individual.phone, 'phone'),
      emergency_contact: this.decryptField(
        individual.emergency_contact,
        'emergency_contact',
      ),
    };
  }

  async list(orgId: string, pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const result = await this.individualDal.find({
      findOptions: { org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { last_name: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return {
      payload: result.payload.map((i) => this.decryptFields(i)),
      paginationMeta: result.paginationMeta,
    };
  }

  async create(
    dto: CreateIndividualDto,
    orgId: string,
    requestingUserId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const encrypted = this.encryptPhiFields(dto);

    const individual = await this.individualDal.create({
      createPayload: {
        org_id: orgId,
        first_name: dto.first_name,
        last_name: dto.last_name,
        ssn: encrypted.ssn ?? null,
        date_of_birth: encrypted.date_of_birth ?? null,
        medicaid_id: encrypted.medicaid_id ?? null,
        diagnosis_codes: encrypted.diagnosis_codes ?? null,
        address: encrypted.address ?? null,
        phone: encrypted.phone ?? null,
        emergency_contact: encrypted.emergency_contact ?? null,
        guardian_id: dto.guardian_id ?? null,
        active: dto.active ?? true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: requestingUserId,
      user_role: userRole,
      action: 'INDIVIDUAL_CREATED',
      action_type: 'CREATE',
      table_name: 'individuals',
      record_id: individual.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(individual);
  }

  async findById(
    id: string,
    orgId: string,
    requestingUserId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const individual = await this.individualDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!individual) {
      throw new NotFoundException();
    }

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: requestingUserId,
      user_role: userRole,
      action: 'INDIVIDUAL_ACCESSED',
      action_type: 'READ',
      table_name: 'individuals',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(individual);
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateIndividualDto,
    requestingUserId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const individual = await this.individualDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!individual) {
      throw new NotFoundException();
    }

    const encrypted = this.encryptPhiFields(dto);

    const updatePayload: Record<string, unknown> = {};
    if (dto.first_name !== undefined) updatePayload.first_name = dto.first_name;
    if (dto.last_name !== undefined) updatePayload.last_name = dto.last_name;
    if (dto.guardian_id !== undefined)
      updatePayload.guardian_id = dto.guardian_id;
    if (dto.active !== undefined) updatePayload.active = dto.active;
    if (encrypted.ssn !== undefined) updatePayload.ssn = encrypted.ssn;
    if (encrypted.date_of_birth !== undefined)
      updatePayload.date_of_birth = encrypted.date_of_birth;
    if (encrypted.medicaid_id !== undefined)
      updatePayload.medicaid_id = encrypted.medicaid_id;
    if (encrypted.diagnosis_codes !== undefined)
      updatePayload.diagnosis_codes = encrypted.diagnosis_codes;
    if (encrypted.address !== undefined) updatePayload.address = encrypted.address;
    if (encrypted.phone !== undefined) updatePayload.phone = encrypted.phone;
    if (encrypted.emergency_contact !== undefined)
      updatePayload.emergency_contact = encrypted.emergency_contact;

    const updated = await this.individualDal.update({
      identifierOptions: { id } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: requestingUserId,
      user_role: userRole,
      action: 'INDIVIDUAL_UPDATED',
      action_type: 'UPDATE',
      table_name: 'individuals',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated ? this.decryptFields(updated) : null;
  }
}
