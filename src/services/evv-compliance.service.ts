import { Injectable } from '@nestjs/common';
import { EvvPunchDal } from '@dals/evv-punch.dal';
import { EvvCorrectionDal } from '@dals/evv-correction.dal';
import { ShiftDal } from '@dals/shift.dal';
import { PunchType } from '@enums/punch-type.enum';
import { CorrectionStatus } from '@enums/correction-status.enum';
import { ShiftStatus } from '@enums/shift-status.enum';
import { type EvvComplianceReport } from '@app-types/reporting.types';
import { MAX_ANALYTICS_RECORDS } from '@utils/analytics-constants';

@Injectable()
export class EvvComplianceService {
  constructor(
    private readonly evvPunchDal: EvvPunchDal,
    private readonly evvCorrectionDal: EvvCorrectionDal,
    private readonly shiftDal: ShiftDal,
  ) {}

  async getEvvComplianceReport(
    orgId: string,
    filters?: { date_from?: string; date_to?: string; staff_id?: string },
  ): Promise<EvvComplianceReport> {
    const punchFindOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.staff_id) punchFindOptions.staff_id = filters.staff_id;

    const punches = await this.evvPunchDal.find({
      findOptions: punchFindOptions as never,
      paginationPayload: { limit: MAX_ANALYTICS_RECORDS, page: 1 },
      transactionOptions: { useTransaction: false },
    });

    let totalPunches = 0;
    let clockInCount = 0;
    let clockOutCount = 0;
    let gpsConfirmedCount = 0;
    const staffWithPunch = new Set<string>();

    for (const punch of punches.payload) {
      // Date filter on punch timestamp
      if (filters?.date_from) {
        const punchDate = new Date(punch.timestamp).toISOString().split('T')[0];
        if (punchDate < filters.date_from) continue;
      }
      if (filters?.date_to) {
        const punchDate = new Date(punch.timestamp).toISOString().split('T')[0];
        if (punchDate > filters.date_to) continue;
      }

      totalPunches++;
      if (punch.punch_type === PunchType.CLOCK_IN) clockInCount++;
      if (punch.punch_type === PunchType.CLOCK_OUT) clockOutCount++;
      if (punch.location_confirmed) gpsConfirmedCount++;
      if (punch.shift_id) staffWithPunch.add(punch.shift_id);
    }

    // Corrections
    const correctionFindOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.staff_id) correctionFindOptions.staff_id = filters.staff_id;

    const corrections = await this.evvCorrectionDal.find({
      findOptions: correctionFindOptions as never,
      paginationPayload: { limit: MAX_ANALYTICS_RECORDS, page: 1 },
      transactionOptions: { useTransaction: false },
    });

    let correctionCount = 0;
    let correctionsApproved = 0;
    let correctionsRejected = 0;
    let correctionsPending = 0;

    for (const correction of corrections.payload) {
      if (filters?.date_from) {
        const reqDate = new Date(correction.requested_time).toISOString().split('T')[0];
        if (reqDate < filters.date_from) continue;
      }
      if (filters?.date_to) {
        const reqDate = new Date(correction.requested_time).toISOString().split('T')[0];
        if (reqDate > filters.date_to) continue;
      }

      correctionCount++;
      if (correction.status === CorrectionStatus.APPROVED) correctionsApproved++;
      if (correction.status === CorrectionStatus.REJECTED) correctionsRejected++;
      if (correction.status === CorrectionStatus.PENDING) correctionsPending++;
    }

    // Missed punches — completed shifts without matching EVV punch
    const shiftFindOptions: Record<string, unknown> = {
      org_id: orgId,
      status: ShiftStatus.COMPLETED,
    };
    if (filters?.staff_id) shiftFindOptions.staff_id = filters.staff_id;

    const shifts = await this.shiftDal.find({
      findOptions: shiftFindOptions as never,
      paginationPayload: { limit: MAX_ANALYTICS_RECORDS, page: 1 },
      transactionOptions: { useTransaction: false },
    });

    let missedPunchCount = 0;
    for (const shift of shifts.payload) {
      if (filters?.date_from && shift.shift_date < filters.date_from) continue;
      if (filters?.date_to && shift.shift_date > filters.date_to) continue;

      if (!staffWithPunch.has(shift.id)) {
        missedPunchCount++;
      }
    }

    return {
      total_punches: totalPunches,
      clock_in_count: clockInCount,
      clock_out_count: clockOutCount,
      gps_confirmed_count: gpsConfirmedCount,
      gps_confirmation_rate_percent: totalPunches > 0
        ? Math.round((gpsConfirmedCount / totalPunches) * 10000) / 100
        : 0,
      missed_punch_count: missedPunchCount,
      correction_count: correctionCount,
      corrections_approved: correctionsApproved,
      corrections_rejected: correctionsRejected,
      corrections_pending: correctionsPending,
    };
  }
}
