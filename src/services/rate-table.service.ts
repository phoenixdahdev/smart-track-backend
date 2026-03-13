import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RateTableDal } from '@dals/rate-table.dal';
import { PayerConfigDal } from '@dals/payer-config.dal';
import { ServiceCodeDal } from '@dals/service-code.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateRateTableDto } from '@dtos/create-rate-table.dto';
import { type UpdateRateTableDto } from '@dtos/update-rate-table.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class RateTableService {
  constructor(
    private readonly rateTableDal: RateTableDal,
    private readonly payerConfigDal: PayerConfigDal,
    private readonly serviceCodeDal: ServiceCodeDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateRateTableDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const record = await this.rateTableDal.create({
      createPayload: {
        org_id: orgId,
        payer_config_id: dto.payer_config_id,
        service_code_id: dto.service_code_id,
        rate_cents: dto.rate_cents,
        effective_date: dto.effective_date,
        end_date: dto.end_date ?? null,
        active: true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'RATE_TABLE_CREATED',
      action_type: 'CREATE',
      table_name: 'rate_tables',
      record_id: record.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return record;
  }

  async findById(id: string, orgId: string) {
    const record = await this.rateTableDal.get({
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

    return this.rateTableDal.find({
      findOptions: { org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { effective_date: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async update(
    id: string,
    dto: UpdateRateTableDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const existing = await this.findById(id, orgId);

    const updated = await this.rateTableDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'RATE_TABLE_UPDATED',
      action_type: 'UPDATE',
      table_name: 'rate_tables',
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

    const updated = await this.rateTableDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: { active: false } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'RATE_TABLE_DEACTIVATED',
      action_type: 'UPDATE',
      table_name: 'rate_tables',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async findRate(
    payerConfigId: string,
    serviceCodeId: string,
    serviceDate: string,
    orgId: string,
  ) {
    const allRates = await this.rateTableDal.find({
      findOptions: {
        org_id: orgId,
        payer_config_id: payerConfigId,
        service_code_id: serviceCodeId,
        active: true,
      } as never,
      order: { effective_date: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const matchingRate = allRates.payload.find((rate) => {
      const effectiveDate = rate.effective_date;
      const endDate = rate.end_date;
      return (
        serviceDate >= effectiveDate &&
        (endDate == null || serviceDate <= endDate)
      );
    });

    return matchingRate ?? null;
  }
}
