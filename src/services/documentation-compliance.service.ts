import { Injectable } from '@nestjs/common';
import { ServiceRecordDal } from '@dals/service-record.dal';
import { DailyNoteDal } from '@dals/daily-note.dal';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import {
  type DocumentationComplianceReport,
  type ServiceRecordStatusCount,
} from '@app-types/reporting.types';
import { MAX_ANALYTICS_RECORDS } from '@utils/analytics-constants';

@Injectable()
export class DocumentationComplianceService {
  constructor(
    private readonly serviceRecordDal: ServiceRecordDal,
    private readonly dailyNoteDal: DailyNoteDal,
  ) {}

  async getComplianceReport(
    orgId: string,
    filters?: { date_from?: string; date_to?: string; staff_id?: string; program_id?: string },
  ): Promise<DocumentationComplianceReport> {
    const findOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.staff_id) findOptions.staff_id = filters.staff_id;
    if (filters?.program_id) findOptions.program_id = filters.program_id;

    const records = await this.serviceRecordDal.find({
      findOptions: findOptions as never,
      paginationPayload: { limit: MAX_ANALYTICS_RECORDS, page: 1 },
      transactionOptions: { useTransaction: false },
    });

    const statusMap = new Map<ServiceRecordStatus, number>();
    let approvedCount = 0;
    let rejectedCount = 0;
    let totalRecords = 0;
    let reviewHoursSum = 0;
    let reviewCount = 0;
    const recordIds = new Set<string>();

    for (const record of records.payload) {
      // Date filter
      if (filters?.date_from && record.service_date < filters.date_from) continue;
      if (filters?.date_to && record.service_date > filters.date_to) continue;

      totalRecords++;
      recordIds.add(record.id);

      const status = record.status;
      statusMap.set(status, (statusMap.get(status) ?? 0) + 1);

      if (status === ServiceRecordStatus.APPROVED) {
        approvedCount++;
        if (record.approved_at && record.submitted_at) {
          const hours =
            (new Date(record.approved_at).getTime() - new Date(record.submitted_at).getTime()) /
            (1000 * 60 * 60);
          reviewHoursSum += hours;
          reviewCount++;
        }
      }

      if (status === ServiceRecordStatus.REJECTED) {
        rejectedCount++;
      }
    }

    // Count records with daily notes
    const dailyNotes = await this.dailyNoteDal.find({
      findOptions: { org_id: orgId } as never,
      paginationPayload: { limit: MAX_ANALYTICS_RECORDS, page: 1 },
      transactionOptions: { useTransaction: false },
    });

    const recordsWithNotes = new Set<string>();
    for (const note of dailyNotes.payload) {
      if (recordIds.has(note.service_record_id)) {
        recordsWithNotes.add(note.service_record_id);
      }
    }

    const decided = approvedCount + rejectedCount;
    const by_status: ServiceRecordStatusCount[] = Array.from(statusMap.entries()).map(
      ([status, count]) => ({ status, count }),
    );

    return {
      total_records: totalRecords,
      by_status,
      approval_rate_percent: decided > 0
        ? Math.round((approvedCount / decided) * 10000) / 100
        : 0,
      rejection_rate_percent: decided > 0
        ? Math.round((rejectedCount / decided) * 10000) / 100
        : 0,
      avg_hours_to_review: reviewCount > 0
        ? Math.round(reviewHoursSum / reviewCount * 100) / 100
        : 0,
      records_with_daily_notes: recordsWithNotes.size,
      records_without_daily_notes: totalRecords - recordsWithNotes.size,
      documentation_completeness_percent: totalRecords > 0
        ? Math.round((recordsWithNotes.size / totalRecords) * 10000) / 100
        : 0,
    };
  }
}
