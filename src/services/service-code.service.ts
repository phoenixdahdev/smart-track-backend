import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceCodeDal } from '@dals/service-code.dal';
import { GlobalServiceCodeDal } from '@dals/global-service-code.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateServiceCodeDto } from '@dtos/create-service-code.dto';
import { type UpdateServiceCodeDto } from '@dtos/update-service-code.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class ServiceCodeService {
  constructor(
    private readonly serviceCodeDal: ServiceCodeDal,
    private readonly globalServiceCodeDal: GlobalServiceCodeDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateServiceCodeDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const globalCode = await this.globalServiceCodeDal.get({
      identifierOptions: { id: dto.global_code_id } as never,
    });

    if (!globalCode) {
      throw new BadRequestException('Global service code not found');
    }

    const record = await this.serviceCodeDal.create({
      createPayload: {
        org_id: orgId,
        global_code_id: dto.global_code_id,
        code: dto.code ?? globalCode.code,
        description: dto.description ?? globalCode.description,
        modifiers: dto.modifiers ?? [],
        unit_of_measure: dto.unit_of_measure ?? globalCode.billing_unit,
        active: true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'SERVICE_CODE_CREATED',
      action_type: 'CREATE',
      table_name: 'service_codes',
      record_id: record.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return record;
  }

  async findById(id: string, orgId: string) {
    const record = await this.serviceCodeDal.get({
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

    return this.serviceCodeDal.find({
      findOptions: { org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { code: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async update(
    id: string,
    dto: UpdateServiceCodeDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const existing = await this.findById(id, orgId);

    const updated = await this.serviceCodeDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'SERVICE_CODE_UPDATED',
      action_type: 'UPDATE',
      table_name: 'service_codes',
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

    const updated = await this.serviceCodeDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: { active: false } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'SERVICE_CODE_DEACTIVATED',
      action_type: 'UPDATE',
      table_name: 'service_codes',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }
}
