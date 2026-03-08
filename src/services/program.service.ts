import { Injectable, NotFoundException } from '@nestjs/common';
import { ProgramDal } from '@dals/program.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateProgramDto } from '@dtos/create-program.dto';
import { type UpdateProgramDto } from '@dtos/update-program.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class ProgramService {
  constructor(
    private readonly programDal: ProgramDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async list(orgId: string, pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.programDal.find({
      findOptions: { org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { name: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async create(
    dto: CreateProgramDto,
    orgId: string,
    requestingUserId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const program = await this.programDal.create({
      createPayload: {
        org_id: orgId,
        name: dto.name,
        type: dto.type ?? null,
        description: dto.description ?? null,
        active: dto.active ?? true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: requestingUserId,
      user_role: userRole,
      action: 'PROGRAM_CREATED',
      action_type: 'CREATE',
      table_name: 'programs',
      record_id: program.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return program;
  }

  async findById(id: string, orgId: string) {
    const program = await this.programDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!program) {
      throw new NotFoundException();
    }

    return program;
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateProgramDto,
    requestingUserId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const program = await this.programDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!program) {
      throw new NotFoundException();
    }

    const updated = await this.programDal.update({
      identifierOptions: { id } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: requestingUserId,
      user_role: userRole,
      action: 'PROGRAM_UPDATED',
      action_type: 'UPDATE',
      table_name: 'programs',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }
}
