import { Injectable } from '@nestjs/common';
import { ServiceRecordDal } from '@dals/service-record.dal';
import { ClaimDal } from '@dals/claim.dal';
import { IndividualPayerCoverageDal } from '@dals/individual-payer-coverage.dal';
import { ServiceAuthorizationDal } from '@dals/service-authorization.dal';
import { ServiceCodeDal } from '@dals/service-code.dal';
import { type PaginationValidator } from '@utils/pagination-utils';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import { ClaimStatus } from '@enums/claim-status.enum';

const TERMINAL_CLAIM_STATUSES = [
  ClaimStatus.VOID,
  ClaimStatus.DENIED,
];

@Injectable()
export class BillingQueueService {
  constructor(
    private readonly serviceRecordDal: ServiceRecordDal,
    private readonly claimDal: ClaimDal,
    private readonly coverageDal: IndividualPayerCoverageDal,
    private readonly serviceAuthorizationDal: ServiceAuthorizationDal,
    private readonly serviceCodeDal: ServiceCodeDal,
  ) {}

  async getQueue(
    orgId: string,
    pagination?: PaginationValidator,
    filters?: {
      date_from?: string;
      date_to?: string;
      individual_id?: string;
      program_id?: string;
    },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const approvedRecords = await this.serviceRecordDal.find({
      findOptions: {
        org_id: orgId,
        status: ServiceRecordStatus.APPROVED,
      } as never,
      paginationPayload: { page: 1, limit: 1000 },
      order: { service_date: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    let records = approvedRecords.payload;

    if (filters?.date_from) {
      records = records.filter((r) => r.service_date >= filters.date_from!);
    }
    if (filters?.date_to) {
      records = records.filter((r) => r.service_date <= filters.date_to!);
    }
    if (filters?.individual_id) {
      records = records.filter(
        (r) => r.individual_id === filters.individual_id,
      );
    }
    if (filters?.program_id) {
      records = records.filter((r) => r.program_id === filters.program_id);
    }

    const unbilledRecords: typeof records = [];
    for (const record of records) {
      const existingClaims = await this.claimDal.find({
        findOptions: {
          org_id: orgId,
          service_record_id: record.id,
        } as never,
        transactionOptions: { useTransaction: false },
      });

      const hasActiveClaim = existingClaims.payload.some(
        (c) => !TERMINAL_CLAIM_STATUSES.includes(c.status),
      );

      if (!hasActiveClaim) {
        unbilledRecords.push(record);
      }
    }

    const total = unbilledRecords.length;
    const start = (page - 1) * limit;
    const paged = unbilledRecords.slice(start, start + limit);

    const totalPages = Math.ceil(total / limit);

    return {
      payload: paged,
      paginationMeta: {
        total,
        limit,
        page,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_previous: page > 1,
      },
    };
  }

  async enrichQueueItem(serviceRecordId: string, orgId: string) {
    const record = await this.serviceRecordDal.get({
      identifierOptions: { id: serviceRecordId, org_id: orgId } as never,
    });

    if (!record) {
      return null;
    }

    const coverages = await this.coverageDal.find({
      findOptions: {
        org_id: orgId,
        individual_id: record.individual_id,
        active: true,
      } as never,
      order: { priority: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const activeCoverages = coverages.payload.filter((cov) => {
      const start = cov.coverage_start;
      const end = cov.coverage_end;
      return (
        record.service_date >= start &&
        (end == null || record.service_date <= end)
      );
    });

    let authInfo: Record<string, unknown> | null = null;
    if (record.service_code_id) {
      const auths = await this.serviceAuthorizationDal.find({
        findOptions: {
          org_id: orgId,
          individual_id: record.individual_id,
          service_code_id: record.service_code_id,
        } as never,
        transactionOptions: { useTransaction: false },
      });

      const matchingAuth = auths.payload.find(
        (a) =>
          record.service_date >= a.start_date &&
          record.service_date <= a.end_date,
      );

      if (matchingAuth) {
        authInfo = {
          id: matchingAuth.id,
          auth_number: matchingAuth.auth_number,
          units_authorized: Number(matchingAuth.units_authorized),
          units_used: Number(matchingAuth.units_used),
          units_pending: Number(matchingAuth.units_pending),
          units_remaining:
            Number(matchingAuth.units_authorized) -
            Number(matchingAuth.units_used) -
            Number(matchingAuth.units_pending),
        };
      }
    }

    const flags: string[] = [];
    if (activeCoverages.length === 0) flags.push('NO_PAYER_COVERAGE');
    if (!record.service_code_id) flags.push('NO_SERVICE_CODE');
    if (!authInfo && record.service_code_id) flags.push('NO_AUTHORIZATION');

    return {
      service_record: record,
      coverages: activeCoverages,
      authorization: authInfo,
      flags,
    };
  }
}
