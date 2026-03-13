import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PayerConfigDal } from '@dals/payer-config.dal';
import { GlobalPayerDal } from '@dals/global-payer.dal';
import { AuditLogService } from './audit-log.service';
import { type CreatePayerConfigDto } from '@dtos/create-payer-config.dto';
import { type UpdatePayerConfigDto } from '@dtos/update-payer-config.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class PayerConfigService {
  constructor(
    private readonly payerConfigDal: PayerConfigDal,
    private readonly globalPayerDal: GlobalPayerDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreatePayerConfigDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const globalPayer = await this.globalPayerDal.get({
      identifierOptions: { id: dto.global_payer_id } as never,
    });

    if (!globalPayer) {
      throw new BadRequestException('Global payer not found');
    }

    const record = await this.payerConfigDal.create({
      createPayload: {
        org_id: orgId,
        global_payer_id: dto.global_payer_id,
        payer_name: dto.payer_name ?? globalPayer.payer_name,
        payer_id_edi: dto.payer_id_edi ?? globalPayer.payer_id_edi,
        clearinghouse_routing: dto.clearinghouse_routing ?? {},
        config: dto.config ?? {},
        active: true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'PAYER_CONFIG_CREATED',
      action_type: 'CREATE',
      table_name: 'payer_config',
      record_id: record.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return record;
  }

  async findById(id: string, orgId: string) {
    const record = await this.payerConfigDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!record) {
      throw new NotFoundException();
    }

    return record;
  }

  async list(orgId: string, pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.payerConfigDal.find({
      findOptions: { org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async update(
    id: string,
    dto: UpdatePayerConfigDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const existing = await this.findById(id, orgId);

    const updated = await this.payerConfigDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'PAYER_CONFIG_UPDATED',
      action_type: 'UPDATE',
      table_name: 'payer_config',
      record_id: id,
      before_val: existing as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async deactivate(
    id: string,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    await this.findById(id, orgId);

    const updated = await this.payerConfigDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: { active: false } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'PAYER_CONFIG_DEACTIVATED',
      action_type: 'UPDATE',
      table_name: 'payer_config',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }
}
