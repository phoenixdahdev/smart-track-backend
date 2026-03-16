import { Injectable, NotFoundException } from '@nestjs/common';
import { GlobalServiceCodeDal } from '@dals/global-service-code.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateGlobalServiceCodeDto } from '@dtos/create-global-service-code.dto';
import { type UpdateGlobalServiceCodeDto } from '@dtos/update-global-service-code.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class GlobalServiceCodeService {
  constructor(
    private readonly codeDal: GlobalServiceCodeDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateGlobalServiceCodeDto,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const code = await this.codeDal.create({
      createPayload: {
        ...dto,
        status: 'ACTIVE',
        created_by: operatorId,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'GLOBAL_SERVICE_CODE_CREATED',
      target_type: 'global_service_codes',
      target_id: code.id,
      after_val: code as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: ua,
    });

    return code;
  }

  async findById(id: string) {
    const code = await this.codeDal.get({
      identifierOptions: { id } as never,
    });

    if (!code) {
      throw new NotFoundException();
    }

    return code;
  }

  async list(
    pagination?: PaginationValidator,
    filters?: { code_type?: string; status?: string },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {};
    if (filters?.code_type) findOptions.code_type = filters.code_type;
    if (filters?.status) findOptions.status = filters.status;

    return this.codeDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { code: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async update(
    id: string,
    dto: UpdateGlobalServiceCodeDto,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const before = await this.findById(id);

    const updated = await this.codeDal.update({
      identifierOptions: { id } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'GLOBAL_SERVICE_CODE_UPDATED',
      target_type: 'global_service_codes',
      target_id: id,
      before_val: before as unknown as Record<string, unknown>,
      after_val: updated as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: ua,
    });

    return updated;
  }

  async deprecate(id: string, operatorId: string, ip: string, ua: string) {
    await this.findById(id);

    const updated = await this.codeDal.update({
      identifierOptions: { id } as never,
      updatePayload: {
        status: 'DEPRECATED',
        deprecated_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'GLOBAL_SERVICE_CODE_DEPRECATED',
      target_type: 'global_service_codes',
      target_id: id,
      ip_address: ip,
      user_agent: ua,
    });

    return updated;
  }
}
