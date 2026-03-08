import { Injectable, NotFoundException } from '@nestjs/common';
import { StaffAssignmentDal } from '@dals/staff-assignment.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateStaffAssignmentDto } from '@dtos/create-staff-assignment.dto';
import { type UpdateStaffAssignmentDto } from '@dtos/update-staff-assignment.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class StaffAssignmentService {
  constructor(
    private readonly staffAssignmentDal: StaffAssignmentDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listByIndividual(
    individualId: string,
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.staffAssignmentDal.find({
      findOptions: { individual_id: individualId, org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { effective_date: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async listByStaff(
    staffId: string,
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.staffAssignmentDal.find({
      findOptions: { staff_id: staffId, org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { effective_date: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async create(
    dto: CreateStaffAssignmentDto,
    orgId: string,
    requestingUserId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const assignment = await this.staffAssignmentDal.create({
      createPayload: {
        org_id: orgId,
        staff_id: dto.staff_id,
        individual_id: dto.individual_id,
        program_id: dto.program_id,
        effective_date: dto.effective_date,
        end_date: dto.end_date ?? null,
        active: true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: requestingUserId,
      user_role: userRole,
      action: 'STAFF_ASSIGNMENT_CREATED',
      action_type: 'CREATE',
      table_name: 'staff_assignments',
      record_id: assignment.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return assignment;
  }

  async findById(id: string, orgId: string) {
    const assignment = await this.staffAssignmentDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!assignment) {
      throw new NotFoundException();
    }

    return assignment;
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateStaffAssignmentDto,
    requestingUserId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const assignment = await this.staffAssignmentDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!assignment) {
      throw new NotFoundException();
    }

    const updated = await this.staffAssignmentDal.update({
      identifierOptions: { id } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: requestingUserId,
      user_role: userRole,
      action: 'STAFF_ASSIGNMENT_UPDATED',
      action_type: 'UPDATE',
      table_name: 'staff_assignments',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async endAssignment(
    id: string,
    orgId: string,
    endDate: string,
    requestingUserId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const assignment = await this.staffAssignmentDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!assignment) {
      throw new NotFoundException();
    }

    const updated = await this.staffAssignmentDal.update({
      identifierOptions: { id } as never,
      updatePayload: { end_date: endDate, active: false } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: requestingUserId,
      user_role: userRole,
      action: 'STAFF_ASSIGNMENT_ENDED',
      action_type: 'UPDATE',
      table_name: 'staff_assignments',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }
}
