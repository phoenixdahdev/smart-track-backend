import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CorrectionRequestDal } from '@dals/correction-request.dal';
import { ServiceRecordDal } from '@dals/service-record.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateCorrectionRequestDto } from '@dtos/create-correction-request.dto';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import {
  CorrectionStatus,
  CORRECTION_TRANSITIONS,
} from '@enums/correction-status.enum';
import { validateTransition } from '@utils/state-machine';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class CorrectionRequestService {
  constructor(
    private readonly correctionRequestDal: CorrectionRequestDal,
    private readonly serviceRecordDal: ServiceRecordDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateCorrectionRequestDto,
    orgId: string,
    requestedBy: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const serviceRecord = await this.serviceRecordDal.get({
      identifierOptions: {
        id: dto.service_record_id,
        org_id: orgId,
      } as never,
    });

    if (!serviceRecord) {
      throw new NotFoundException('Service record not found');
    }

    if (serviceRecord.status !== ServiceRecordStatus.APPROVED) {
      throw new BadRequestException(
        'Correction requests can only be created for APPROVED service records',
      );
    }

    const request = await this.correctionRequestDal.create({
      createPayload: {
        org_id: orgId,
        service_record_id: dto.service_record_id,
        requested_by: requestedBy,
        requested_changes: dto.requested_changes,
        status: CorrectionStatus.PENDING,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: requestedBy,
      user_role: userRole,
      action: 'CORRECTION_REQUEST_CREATED',
      action_type: 'CREATE',
      table_name: 'correction_requests',
      record_id: request.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return request;
  }

  async findById(id: string, orgId: string) {
    const request = await this.correctionRequestDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!request) {
      throw new NotFoundException();
    }

    return request;
  }

  async listPending(orgId: string, pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.correctionRequestDal.find({
      findOptions: {
        org_id: orgId,
        status: CorrectionStatus.PENDING,
      } as never,
      paginationPayload: { page, limit },
      order: { created_at: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async listByServiceRecord(serviceRecordId: string, orgId: string) {
    return this.correctionRequestDal.find({
      findOptions: {
        service_record_id: serviceRecordId,
        org_id: orgId,
      } as never,
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async approve(
    id: string,
    orgId: string,
    reviewerId: string,
    reviewerNotes: string | undefined,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const request = await this.correctionRequestDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!request) {
      throw new NotFoundException();
    }

    const canTransition = validateTransition(
      CORRECTION_TRANSITIONS,
      request.status,
      CorrectionStatus.APPROVED,
    );

    if (!canTransition) {
      throw new BadRequestException(
        `Cannot transition from ${request.status} to APPROVED`,
      );
    }

    const updated = await this.correctionRequestDal.update({
      identifierOptions: { id } as never,
      updatePayload: {
        status: CorrectionStatus.APPROVED,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        reviewer_notes: reviewerNotes ?? null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: reviewerId,
      user_role: userRole,
      action: 'CORRECTION_REQUEST_APPROVED',
      action_type: 'UPDATE',
      table_name: 'correction_requests',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async reject(
    id: string,
    orgId: string,
    reviewerId: string,
    reviewerNotes: string | undefined,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const request = await this.correctionRequestDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!request) {
      throw new NotFoundException();
    }

    const canTransition = validateTransition(
      CORRECTION_TRANSITIONS,
      request.status,
      CorrectionStatus.REJECTED,
    );

    if (!canTransition) {
      throw new BadRequestException(
        `Cannot transition from ${request.status} to REJECTED`,
      );
    }

    const updated = await this.correctionRequestDal.update({
      identifierOptions: { id } as never,
      updatePayload: {
        status: CorrectionStatus.REJECTED,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        reviewer_notes: reviewerNotes ?? null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: reviewerId,
      user_role: userRole,
      action: 'CORRECTION_REQUEST_REJECTED',
      action_type: 'UPDATE',
      table_name: 'correction_requests',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }
}
