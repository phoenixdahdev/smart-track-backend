import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceRecordDal } from '@dals/service-record.dal';
import { StaffAssignmentDal } from '@dals/staff-assignment.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateServiceRecordDto } from '@dtos/create-service-record.dto';
import { type UpdateServiceRecordDto } from '@dtos/update-service-record.dto';
import {
  ServiceRecordStatus,
  SERVICE_RECORD_TRANSITIONS,
} from '@enums/service-record-status.enum';
import { validateTransition } from '@utils/state-machine';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class ServiceRecordService {
  constructor(
    private readonly serviceRecordDal: ServiceRecordDal,
    private readonly staffAssignmentDal: StaffAssignmentDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateServiceRecordDto,
    orgId: string,
    staffId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const assignment = await this.staffAssignmentDal.get({
      identifierOptions: {
        staff_id: staffId,
        individual_id: dto.individual_id,
        org_id: orgId,
        active: true,
      } as never,
    });

    if (!assignment) {
      throw new BadRequestException(
        'Staff member is not assigned to this individual',
      );
    }

    const record = await this.serviceRecordDal.create({
      createPayload: {
        org_id: orgId,
        individual_id: dto.individual_id,
        staff_id: staffId,
        program_id: dto.program_id ?? null,
        service_date: dto.service_date,
        service_code_id: dto.service_code_id ?? null,
        units_delivered: dto.units_delivered,
        status: ServiceRecordStatus.DRAFT,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: staffId,
      user_role: userRole,
      action: 'SERVICE_RECORD_CREATED',
      action_type: 'CREATE',
      table_name: 'service_records',
      record_id: record.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return record;
  }

  async findById(id: string, orgId: string) {
    const record = await this.serviceRecordDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!record) {
      throw new NotFoundException();
    }

    return record;
  }

  async findByIdForStaff(id: string, orgId: string, staffId: string) {
    const record = await this.serviceRecordDal.get({
      identifierOptions: { id, org_id: orgId, staff_id: staffId } as never,
    });

    if (!record) {
      throw new NotFoundException();
    }

    return record;
  }

  async listByStaff(
    staffId: string,
    orgId: string,
    pagination?: PaginationValidator,
    statusFilter?: ServiceRecordStatus,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {
      staff_id: staffId,
      org_id: orgId,
    };
    if (statusFilter) {
      findOptions.status = statusFilter;
    }

    return this.serviceRecordDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async listByIndividual(
    individualId: string,
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.serviceRecordDal.find({
      findOptions: { individual_id: individualId, org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { service_date: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async listAll(
    orgId: string,
    pagination?: PaginationValidator,
    statusFilter?: ServiceRecordStatus,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = { org_id: orgId };
    if (statusFilter) {
      findOptions.status = statusFilter;
    }

    return this.serviceRecordDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async listPendingReview(orgId: string, pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.serviceRecordDal.find({
      findOptions: {
        org_id: orgId,
        status: ServiceRecordStatus.PENDING_REVIEW,
      } as never,
      paginationPayload: { page, limit },
      order: { submitted_at: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async update(
    id: string,
    orgId: string,
    staffId: string,
    dto: UpdateServiceRecordDto,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const record = await this.serviceRecordDal.get({
      identifierOptions: { id, org_id: orgId, staff_id: staffId } as never,
    });

    if (!record) {
      throw new NotFoundException();
    }

    if (
      record.status !== ServiceRecordStatus.DRAFT &&
      record.status !== ServiceRecordStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Only DRAFT or REJECTED records can be updated',
      );
    }

    const updatePayload: Record<string, unknown> = {};
    if (dto.program_id !== undefined) updatePayload.program_id = dto.program_id;
    if (dto.service_date !== undefined)
      updatePayload.service_date = dto.service_date;
    if (dto.service_code_id !== undefined)
      updatePayload.service_code_id = dto.service_code_id;
    if (dto.units_delivered !== undefined)
      updatePayload.units_delivered = dto.units_delivered;

    const updated = await this.serviceRecordDal.update({
      identifierOptions: { id } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: staffId,
      user_role: userRole,
      action: 'SERVICE_RECORD_UPDATED',
      action_type: 'UPDATE',
      table_name: 'service_records',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async submitForReview(
    id: string,
    orgId: string,
    staffId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const record = await this.serviceRecordDal.get({
      identifierOptions: { id, org_id: orgId, staff_id: staffId } as never,
    });

    if (!record) {
      throw new NotFoundException();
    }

    const canTransition = validateTransition(
      SERVICE_RECORD_TRANSITIONS,
      record.status,
      ServiceRecordStatus.PENDING_REVIEW,
    );

    if (!canTransition) {
      throw new BadRequestException(
        `Cannot transition from ${record.status} to PENDING_REVIEW`,
      );
    }

    const updated = await this.serviceRecordDal.update({
      identifierOptions: { id } as never,
      updatePayload: {
        status: ServiceRecordStatus.PENDING_REVIEW,
        submitted_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: staffId,
      user_role: userRole,
      action: 'SERVICE_RECORD_SUBMITTED',
      action_type: 'UPDATE',
      table_name: 'service_records',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async approve(
    id: string,
    orgId: string,
    approverId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const record = await this.serviceRecordDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!record) {
      throw new NotFoundException();
    }

    const canTransition = validateTransition(
      SERVICE_RECORD_TRANSITIONS,
      record.status,
      ServiceRecordStatus.APPROVED,
    );

    if (!canTransition) {
      throw new BadRequestException(
        `Cannot transition from ${record.status} to APPROVED`,
      );
    }

    const updated = await this.serviceRecordDal.update({
      identifierOptions: { id } as never,
      updatePayload: {
        status: ServiceRecordStatus.APPROVED,
        approved_by: approverId,
        approved_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: approverId,
      user_role: userRole,
      action: 'SERVICE_RECORD_APPROVED',
      action_type: 'UPDATE',
      table_name: 'service_records',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async reject(
    id: string,
    orgId: string,
    rejectorId: string,
    rejectionReason: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const record = await this.serviceRecordDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!record) {
      throw new NotFoundException();
    }

    const canTransition = validateTransition(
      SERVICE_RECORD_TRANSITIONS,
      record.status,
      ServiceRecordStatus.REJECTED,
    );

    if (!canTransition) {
      throw new BadRequestException(
        `Cannot transition from ${record.status} to REJECTED`,
      );
    }

    const updated = await this.serviceRecordDal.update({
      identifierOptions: { id } as never,
      updatePayload: {
        status: ServiceRecordStatus.REJECTED,
        rejected_by: rejectorId,
        rejection_reason: rejectionReason,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: rejectorId,
      user_role: userRole,
      action: 'SERVICE_RECORD_REJECTED',
      action_type: 'UPDATE',
      table_name: 'service_records',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }
}
