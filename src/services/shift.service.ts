import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShiftDal } from '@dals/shift.dal';
import { StaffAssignmentDal } from '@dals/staff-assignment.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateShiftDto } from '@dtos/create-shift.dto';
import { type UpdateShiftDto } from '@dtos/update-shift.dto';
import { type ShiftEntity } from '@entities/shift.entity';
import { ShiftStatus, SHIFT_TRANSITIONS } from '@enums/shift-status.enum';
import { validateTransition } from '@utils/state-machine';
import { type PaginationValidator } from '@utils/pagination-utils';
import { NotificationTriggerService } from './notification-trigger.service';

@Injectable()
export class ShiftService {
  constructor(
    private readonly shiftDal: ShiftDal,
    private readonly staffAssignmentDal: StaffAssignmentDal,
    private readonly auditLogService: AuditLogService,
    private readonly notificationTriggerService: NotificationTriggerService,
  ) {}

  async create(
    dto: CreateShiftDto,
    orgId: string,
    creatorId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    if (dto.end_time <= dto.start_time) {
      throw new BadRequestException('end_time must be after start_time');
    }

    const assignment = await this.staffAssignmentDal.get({
      identifierOptions: {
        staff_id: dto.staff_id,
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

    const conflicts = await this.checkConflicts(
      orgId,
      dto.staff_id,
      dto.shift_date,
      dto.start_time,
      dto.end_time,
    );

    if (conflicts.length > 0) {
      throw new BadRequestException('Shift conflicts with existing schedule');
    }

    const shift = await this.shiftDal.create({
      createPayload: {
        org_id: orgId,
        staff_id: dto.staff_id,
        individual_id: dto.individual_id,
        site_id: dto.site_id ?? null,
        program_id: dto.program_id ?? null,
        shift_date: dto.shift_date,
        start_time: dto.start_time,
        end_time: dto.end_time,
        status: ShiftStatus.DRAFT,
        created_by: creatorId,
        published_at: null,
        responded_at: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: creatorId,
      user_role: userRole,
      action: 'SHIFT_CREATED',
      action_type: 'CREATE',
      table_name: 'shifts',
      record_id: shift.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return shift;
  }

  async findById(id: string, orgId: string) {
    const shift = await this.shiftDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!shift) {
      throw new NotFoundException();
    }

    return shift;
  }

  async findByIdForStaff(id: string, orgId: string, staffId: string) {
    const shift = await this.shiftDal.get({
      identifierOptions: { id, org_id: orgId, staff_id: staffId } as never,
    });

    if (!shift) {
      throw new NotFoundException();
    }

    return shift;
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateShiftDto,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const shift = await this.findById(id, orgId);

    if (shift.status !== ShiftStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT shifts can be updated');
    }

    const staffId = dto.staff_id ?? shift.staff_id;
    const individualId = dto.individual_id ?? shift.individual_id;

    if (dto.staff_id || dto.individual_id) {
      const assignment = await this.staffAssignmentDal.get({
        identifierOptions: {
          staff_id: staffId,
          individual_id: individualId,
          org_id: orgId,
          active: true,
        } as never,
      });

      if (!assignment) {
        throw new BadRequestException(
          'Staff member is not assigned to this individual',
        );
      }
    }

    const shiftDate = dto.shift_date ?? shift.shift_date;
    const startTime = dto.start_time ?? shift.start_time;
    const endTime = dto.end_time ?? shift.end_time;

    if (endTime <= startTime) {
      throw new BadRequestException('end_time must be after start_time');
    }

    if (dto.staff_id || dto.shift_date || dto.start_time || dto.end_time) {
      const conflicts = await this.checkConflicts(
        orgId,
        staffId,
        shiftDate,
        startTime,
        endTime,
        id,
      );

      if (conflicts.length > 0) {
        throw new BadRequestException('Shift conflicts with existing schedule');
      }
    }

    const updatePayload: Record<string, unknown> = {};
    if (dto.staff_id !== undefined) updatePayload.staff_id = dto.staff_id;
    if (dto.individual_id !== undefined) updatePayload.individual_id = dto.individual_id;
    if (dto.site_id !== undefined) updatePayload.site_id = dto.site_id;
    if (dto.program_id !== undefined) updatePayload.program_id = dto.program_id;
    if (dto.shift_date !== undefined) updatePayload.shift_date = dto.shift_date;
    if (dto.start_time !== undefined) updatePayload.start_time = dto.start_time;
    if (dto.end_time !== undefined) updatePayload.end_time = dto.end_time;

    const updated = await this.shiftDal.update({
      identifierOptions: { id } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'SHIFT_UPDATED',
      action_type: 'UPDATE',
      table_name: 'shifts',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async publish(
    id: string,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const shift = await this.findById(id, orgId);

    if (!validateTransition(SHIFT_TRANSITIONS, shift.status, ShiftStatus.PUBLISHED)) {
      throw new BadRequestException(
        `Cannot publish shift in ${shift.status} status`,
      );
    }

    const updated = await this.shiftDal.update({
      identifierOptions: { id } as never,
      updatePayload: {
        status: ShiftStatus.PUBLISHED,
        published_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'SHIFT_PUBLISHED',
      action_type: 'UPDATE',
      table_name: 'shifts',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    this.notificationTriggerService
      .onShiftPublished(orgId, id, shift.staff_id)
      .catch(() => {});

    return updated;
  }

  async cancel(
    id: string,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const shift = await this.findById(id, orgId);

    if (!validateTransition(SHIFT_TRANSITIONS, shift.status, ShiftStatus.CANCELLED)) {
      throw new BadRequestException(
        `Cannot cancel shift in ${shift.status} status`,
      );
    }

    const updated = await this.shiftDal.update({
      identifierOptions: { id } as never,
      updatePayload: { status: ShiftStatus.CANCELLED } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'SHIFT_CANCELLED',
      action_type: 'UPDATE',
      table_name: 'shifts',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    this.notificationTriggerService
      .onShiftCancelled(orgId, id, shift.staff_id)
      .catch(() => {});

    return updated;
  }

  async accept(
    id: string,
    orgId: string,
    staffId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const shift = await this.findByIdForStaff(id, orgId, staffId);

    if (!validateTransition(SHIFT_TRANSITIONS, shift.status, ShiftStatus.ACCEPTED)) {
      throw new BadRequestException(
        `Cannot accept shift in ${shift.status} status`,
      );
    }

    const updated = await this.shiftDal.update({
      identifierOptions: { id } as never,
      updatePayload: {
        status: ShiftStatus.ACCEPTED,
        responded_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: staffId,
      user_role: userRole,
      action: 'SHIFT_ACCEPTED',
      action_type: 'UPDATE',
      table_name: 'shifts',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async reject(
    id: string,
    orgId: string,
    staffId: string,
    reason: string | undefined,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const shift = await this.findByIdForStaff(id, orgId, staffId);

    if (!validateTransition(SHIFT_TRANSITIONS, shift.status, ShiftStatus.REJECTED)) {
      throw new BadRequestException(
        `Cannot reject shift in ${shift.status} status`,
      );
    }

    const updated = await this.shiftDal.update({
      identifierOptions: { id } as never,
      updatePayload: {
        status: ShiftStatus.REJECTED,
        responded_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: staffId,
      user_role: userRole,
      action: reason ? `SHIFT_REJECTED: ${reason}` : 'SHIFT_REJECTED',
      action_type: 'UPDATE',
      table_name: 'shifts',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async listAll(
    orgId: string,
    pagination?: PaginationValidator,
    filters?: {
      staff_id?: string;
      individual_id?: string;
      status?: ShiftStatus;
      date_from?: string;
      date_to?: string;
    },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.staff_id) findOptions.staff_id = filters.staff_id;
    if (filters?.individual_id) findOptions.individual_id = filters.individual_id;
    if (filters?.status) findOptions.status = filters.status;

    const result = await this.shiftDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { shift_date: 'ASC', start_time: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });

    if (filters?.date_from || filters?.date_to) {
      result.payload = this.filterByDateRange(
        result.payload,
        filters?.date_from,
        filters?.date_to,
      );
    }

    return result;
  }

  async listByStaff(
    staffId: string,
    orgId: string,
    pagination?: PaginationValidator,
    filters?: {
      status?: ShiftStatus;
      date_from?: string;
      date_to?: string;
    },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {
      staff_id: staffId,
      org_id: orgId,
    };
    if (filters?.status) findOptions.status = filters.status;

    const result = await this.shiftDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { shift_date: 'ASC', start_time: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });

    if (filters?.date_from || filters?.date_to) {
      result.payload = this.filterByDateRange(
        result.payload,
        filters?.date_from,
        filters?.date_to,
      );
    }

    return result;
  }

  async listByIndividual(
    individualId: string,
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.shiftDal.find({
      findOptions: { individual_id: individualId, org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { shift_date: 'ASC', start_time: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async checkConflicts(
    orgId: string,
    staffId: string,
    shiftDate: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<ShiftEntity[]> {
    const terminalStatuses = [
      ShiftStatus.REJECTED,
      ShiftStatus.CANCELLED,
      ShiftStatus.COMPLETED,
    ];

    const allShifts = await this.shiftDal.find({
      findOptions: {
        org_id: orgId,
        staff_id: staffId,
        shift_date: shiftDate,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    return allShifts.payload.filter((shift) => {
      if (excludeId && shift.id === excludeId) return false;
      if (terminalStatuses.includes(shift.status)) return false;

      return startTime < shift.end_time && endTime > shift.start_time;
    });
  }

  private filterByDateRange(
    shifts: ShiftEntity[],
    dateFrom?: string,
    dateTo?: string,
  ): ShiftEntity[] {
    return shifts.filter((shift) => {
      if (dateFrom && shift.shift_date < dateFrom) return false;
      if (dateTo && shift.shift_date > dateTo) return false;
      return true;
    });
  }
}
