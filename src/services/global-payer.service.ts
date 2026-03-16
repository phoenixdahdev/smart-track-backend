import { Injectable, NotFoundException } from '@nestjs/common';
import { GlobalPayerDal } from '@dals/global-payer.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateGlobalPayerDto } from '@dtos/create-global-payer.dto';
import { type UpdateGlobalPayerDto } from '@dtos/update-global-payer.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class GlobalPayerService {
  constructor(
    private readonly payerDal: GlobalPayerDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateGlobalPayerDto,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const payer = await this.payerDal.create({
      createPayload: {
        ...dto,
        state: dto.state ?? null,
        program_type: dto.program_type ?? null,
        clearinghouse_id: dto.clearinghouse_id ?? null,
        config: dto.config ?? {},
        active: true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'GLOBAL_PAYER_CREATED',
      target_type: 'global_payers',
      target_id: payer.id,
      after_val: payer as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: ua,
    });

    return payer;
  }

  async findById(id: string) {
    const payer = await this.payerDal.get({
      identifierOptions: { id } as never,
    });

    if (!payer) {
      throw new NotFoundException();
    }

    return payer;
  }

  async list(
    pagination?: PaginationValidator,
    filters?: { state?: string; active?: boolean },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {};
    if (filters?.state) findOptions.state = filters.state;
    if (filters?.active !== undefined) findOptions.active = filters.active;

    return this.payerDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { payer_name: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async update(
    id: string,
    dto: UpdateGlobalPayerDto,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const before = await this.findById(id);

    const updated = await this.payerDal.update({
      identifierOptions: { id } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'GLOBAL_PAYER_UPDATED',
      target_type: 'global_payers',
      target_id: id,
      before_val: before as unknown as Record<string, unknown>,
      after_val: updated as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: ua,
    });

    return updated;
  }

  async deactivate(id: string, operatorId: string, ip: string, ua: string) {
    await this.findById(id);

    const updated = await this.payerDal.update({
      identifierOptions: { id } as never,
      updatePayload: { active: false } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'GLOBAL_PAYER_DEACTIVATED',
      target_type: 'global_payers',
      target_id: id,
      ip_address: ip,
      user_agent: ua,
    });

    return updated;
  }
}
