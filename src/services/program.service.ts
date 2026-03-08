import { Injectable, NotFoundException } from '@nestjs/common';
import { ProgramDal } from '@dals/program.dal';
import { type CreateProgramDto } from '@dtos/create-program.dto';
import { type UpdateProgramDto } from '@dtos/update-program.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class ProgramService {
  constructor(private readonly programDal: ProgramDal) {}

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

  async create(dto: CreateProgramDto, orgId: string) {
    return this.programDal.create({
      createPayload: {
        org_id: orgId,
        name: dto.name,
        type: dto.type ?? null,
        description: dto.description ?? null,
        active: dto.active ?? true,
      } as never,
      transactionOptions: { useTransaction: false },
    });
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

  async update(id: string, orgId: string, dto: UpdateProgramDto) {
    const program = await this.programDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!program) {
      throw new NotFoundException();
    }

    return this.programDal.update({
      identifierOptions: { id } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });
  }
}
