import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EvvCorrectionDal } from '@dals/evv-correction.dal';
import { EvvPunchDal } from '@dals/evv-punch.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateEvvCorrectionDto } from '@dtos/create-evv-correction.dto';
import { type FlagMissedPunchDto } from '@dtos/flag-missed-punch.dto';
import {
  CorrectionStatus,
  CORRECTION_TRANSITIONS,
} from '@enums/correction-status.enum';
import { validateTransition } from '@utils/state-machine';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class EvvCorrectionService {
  constructor(
    private readonly evvCorrectionDal: EvvCorrectionDal,
    private readonly evvPunchDal: EvvPunchDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateEvvCorrectionDto,
    orgId: string,
    staffId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const correction = await this.evvCorrectionDal.create({
      createPayload: {
        org_id: orgId,
        staff_id: staffId,
        individual_id: dto.individual_id,
        shift_id: dto.shift_id ?? null,
        punch_type: dto.punch_type,
        requested_time: new Date(dto.requested_time),
        reason: dto.reason,
        status: CorrectionStatus.PENDING,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: staffId,
      user_role: userRole,
      action: 'EVV_CORRECTION_CREATED',
      action_type: 'CREATE',
      table_name: 'evv_corrections',
      record_id: correction.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return correction;
  }

  async findById(id: string, orgId: string) {
    const correction = await this.evvCorrectionDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!correction) {
      throw new NotFoundException();
    }

    return correction;
  }

  async listByStaff(
    staffId: string,
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.evvCorrectionDal.find({
      findOptions: { staff_id: staffId, org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async listPending(orgId: string, pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.evvCorrectionDal.find({
      findOptions: {
        org_id: orgId,
        status: CorrectionStatus.PENDING,
      } as never,
      paginationPayload: { page, limit },
      order: { created_at: 'ASC' } as never,
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
    const correction = await this.evvCorrectionDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!correction) {
      throw new NotFoundException();
    }

    const canTransition = validateTransition(
      CORRECTION_TRANSITIONS,
      correction.status,
      CorrectionStatus.APPROVED,
    );

    if (!canTransition) {
      throw new BadRequestException(
        `Cannot transition from ${correction.status} to APPROVED`,
      );
    }

    // Create the corrected punch
    const newPunch = await this.evvPunchDal.create({
      createPayload: {
        org_id: orgId,
        staff_id: correction.staff_id,
        individual_id: correction.individual_id,
        shift_id: correction.shift_id,
        punch_type: correction.punch_type,
        timestamp: correction.requested_time,
        gps_latitude: null,
        gps_longitude: null,
        location_confirmed: false,
        device_id: null,
        notes: `Created from approved correction ${id}`,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    const updated = await this.evvCorrectionDal.update({
      identifierOptions: { id } as never,
      updatePayload: {
        status: CorrectionStatus.APPROVED,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: reviewerId,
      user_role: userRole,
      action: 'EVV_CORRECTION_APPROVED',
      action_type: 'UPDATE',
      table_name: 'evv_corrections',
      record_id: id,
      after_val: { created_punch_id: newPunch.id },
      ip_address: ip,
      user_agent: userAgent,
    });

    return { ...updated, created_punch: newPunch };
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
    const correction = await this.evvCorrectionDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!correction) {
      throw new NotFoundException();
    }

    const canTransition = validateTransition(
      CORRECTION_TRANSITIONS,
      correction.status,
      CorrectionStatus.REJECTED,
    );

    if (!canTransition) {
      throw new BadRequestException(
        `Cannot transition from ${correction.status} to REJECTED`,
      );
    }

    const updated = await this.evvCorrectionDal.update({
      identifierOptions: { id } as never,
      updatePayload: {
        status: CorrectionStatus.REJECTED,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: reviewerId,
      user_role: userRole,
      action: 'EVV_CORRECTION_REJECTED',
      action_type: 'UPDATE',
      table_name: 'evv_corrections',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async flagMissedPunch(
    dto: FlagMissedPunchDto,
    orgId: string,
    flaggedBy: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const correction = await this.evvCorrectionDal.create({
      createPayload: {
        org_id: orgId,
        staff_id: dto.staff_id,
        individual_id: dto.individual_id,
        shift_id: dto.shift_id ?? null,
        punch_type: dto.punch_type,
        requested_time: new Date(dto.requested_time),
        reason: dto.reason,
        status: CorrectionStatus.PENDING,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: flaggedBy,
      user_role: userRole,
      action: 'EVV_MISSED_PUNCH_FLAGGED',
      action_type: 'CREATE',
      table_name: 'evv_corrections',
      record_id: correction.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return correction;
  }
}
