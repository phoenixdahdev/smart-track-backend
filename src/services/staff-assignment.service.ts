import { Injectable, NotFoundException } from '@nestjs/common';
import { StaffAssignmentDal } from '@dals/staff-assignment.dal';
import { type CreateStaffAssignmentDto } from '@dtos/create-staff-assignment.dto';
import { type UpdateStaffAssignmentDto } from '@dtos/update-staff-assignment.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class StaffAssignmentService {
  constructor(private readonly staffAssignmentDal: StaffAssignmentDal) {}

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

  async create(dto: CreateStaffAssignmentDto, orgId: string) {
    return this.staffAssignmentDal.create({
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

  async update(id: string, orgId: string, dto: UpdateStaffAssignmentDto) {
    const assignment = await this.staffAssignmentDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!assignment) {
      throw new NotFoundException();
    }

    return this.staffAssignmentDal.update({
      identifierOptions: { id } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async endAssignment(id: string, orgId: string, endDate: string) {
    const assignment = await this.staffAssignmentDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!assignment) {
      throw new NotFoundException();
    }

    return this.staffAssignmentDal.update({
      identifierOptions: { id } as never,
      updatePayload: { end_date: endDate, active: false } as never,
      transactionOptions: { useTransaction: false },
    });
  }
}
