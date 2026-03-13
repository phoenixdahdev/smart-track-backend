import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IndividualPayerCoverageDal } from '@dals/individual-payer-coverage.dal';
import { IndividualDal } from '@dals/individual.dal';
import { PayerConfigDal } from '@dals/payer-config.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateIndividualPayerCoverageDto } from '@dtos/create-individual-payer-coverage.dto';
import { type UpdateIndividualPayerCoverageDto } from '@dtos/update-individual-payer-coverage.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class IndividualPayerCoverageService {
  constructor(
    private readonly coverageDal: IndividualPayerCoverageDal,
    private readonly individualDal: IndividualDal,
    private readonly payerConfigDal: PayerConfigDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateIndividualPayerCoverageDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const record = await this.coverageDal.create({
      createPayload: {
        org_id: orgId,
        individual_id: dto.individual_id,
        payer_config_id: dto.payer_config_id,
        subscriber_id: dto.subscriber_id,
        member_id: dto.member_id ?? null,
        group_number: dto.group_number ?? null,
        relationship: dto.relationship ?? 'SELF',
        coverage_start: dto.coverage_start,
        coverage_end: dto.coverage_end ?? null,
        priority: dto.priority ?? 1,
        active: true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'COVERAGE_CREATED',
      action_type: 'CREATE',
      table_name: 'individual_payer_coverages',
      record_id: record.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return record;
  }

  async findById(id: string, orgId: string) {
    const record = await this.coverageDal.get({
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

    return this.coverageDal.find({
      findOptions: { org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async listByIndividual(
    individualId: string,
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.coverageDal.find({
      findOptions: {
        org_id: orgId,
        individual_id: individualId,
        active: true,
      } as never,
      paginationPayload: { page, limit },
      order: { priority: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async update(
    id: string,
    dto: UpdateIndividualPayerCoverageDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const existing = await this.findById(id, orgId);

    const updated = await this.coverageDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'COVERAGE_UPDATED',
      action_type: 'UPDATE',
      table_name: 'individual_payer_coverages',
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

    const updated = await this.coverageDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: { active: false } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'COVERAGE_DEACTIVATED',
      action_type: 'UPDATE',
      table_name: 'individual_payer_coverages',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async findCoverageForDate(
    individualId: string,
    serviceDate: string,
    orgId: string,
  ) {
    const allCoverage = await this.coverageDal.find({
      findOptions: {
        org_id: orgId,
        individual_id: individualId,
        active: true,
      } as never,
      order: { priority: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return allCoverage.payload.filter((cov) => {
      const start = cov.coverage_start;
      const end = cov.coverage_end;
      return serviceDate >= start && (end == null || serviceDate <= end);
    });
  }
}
