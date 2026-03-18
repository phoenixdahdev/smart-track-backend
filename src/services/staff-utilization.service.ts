import { Injectable } from '@nestjs/common';
import { ServiceRecordDal } from '@dals/service-record.dal';
import { ShiftDal } from '@dals/shift.dal';
import { EvvPunchDal } from '@dals/evv-punch.dal';
import { UserDal } from '@dals/user.dal';
import { PunchType } from '@enums/punch-type.enum';
import { ShiftStatus } from '@enums/shift-status.enum';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import {
  type StaffUtilizationReport,
  type StaffUtilizationRow,
} from '@app-types/reporting.types';

@Injectable()
export class StaffUtilizationService {
  constructor(
    private readonly serviceRecordDal: ServiceRecordDal,
    private readonly shiftDal: ShiftDal,
    private readonly evvPunchDal: EvvPunchDal,
    private readonly userDal: UserDal,
  ) {}

  async getStaffUtilization(
    orgId: string,
    filters?: { date_from?: string; date_to?: string; staff_id?: string; program_id?: string },
  ): Promise<StaffUtilizationReport> {
    // Load service records
    const srFindOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.staff_id) srFindOptions.staff_id = filters.staff_id;
    if (filters?.program_id) srFindOptions.program_id = filters.program_id;

    const records = await this.serviceRecordDal.find({
      findOptions: srFindOptions as never,
      transactionOptions: { useTransaction: false },
    });

    // Load shifts
    const shiftFindOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.staff_id) shiftFindOptions.staff_id = filters.staff_id;
    if (filters?.program_id) shiftFindOptions.program_id = filters.program_id;

    const shifts = await this.shiftDal.find({
      findOptions: shiftFindOptions as never,
      transactionOptions: { useTransaction: false },
    });

    // Load EVV punches for hours calculation
    const punchFindOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.staff_id) punchFindOptions.staff_id = filters.staff_id;

    const punches = await this.evvPunchDal.find({
      findOptions: punchFindOptions as never,
      transactionOptions: { useTransaction: false },
    });

    // Build per-staff data
    const staffMap = new Map<string, {
      units_delivered: number;
      shifts_scheduled: number;
      shifts_completed: number;
      service_records_submitted: number;
      hours_logged: number;
    }>();

    const ensureStaff = (staffId: string) => {
      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, {
          units_delivered: 0,
          shifts_scheduled: 0,
          shifts_completed: 0,
          service_records_submitted: 0,
          hours_logged: 0,
        });
      }
      return staffMap.get(staffId)!;
    };

    // Service records
    for (const rec of records.payload) {
      if (filters?.date_from && rec.service_date < filters.date_from) continue;
      if (filters?.date_to && rec.service_date > filters.date_to) continue;

      const s = ensureStaff(rec.staff_id);
      s.units_delivered += Number(rec.units_delivered);
      if (
        rec.status === ServiceRecordStatus.PENDING_REVIEW ||
        rec.status === ServiceRecordStatus.APPROVED
      ) {
        s.service_records_submitted++;
      }
    }

    // Shifts
    for (const shift of shifts.payload) {
      if (filters?.date_from && shift.shift_date < filters.date_from) continue;
      if (filters?.date_to && shift.shift_date > filters.date_to) continue;

      const s = ensureStaff(shift.staff_id);
      s.shifts_scheduled++;
      if (shift.status === ShiftStatus.COMPLETED) {
        s.shifts_completed++;
      }
    }

    // Hours from paired EVV punches
    // Group punches by staff, sort by timestamp, pair CLOCK_IN/CLOCK_OUT
    const punchByStaff = new Map<string, Array<{ type: PunchType; timestamp: Date }>>();
    for (const punch of punches.payload) {
      if (filters?.date_from) {
        const pDate = new Date(punch.timestamp).toISOString().split('T')[0];
        if (pDate < filters.date_from) continue;
      }
      if (filters?.date_to) {
        const pDate = new Date(punch.timestamp).toISOString().split('T')[0];
        if (pDate > filters.date_to) continue;
      }

      if (!punchByStaff.has(punch.staff_id)) {
        punchByStaff.set(punch.staff_id, []);
      }
      punchByStaff.get(punch.staff_id)!.push({
        type: punch.punch_type,
        timestamp: new Date(punch.timestamp),
      });
    }

    for (const [staffId, staffPunches] of punchByStaff.entries()) {
      const s = ensureStaff(staffId);
      staffPunches.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      for (let i = 0; i < staffPunches.length - 1; i++) {
        if (
          staffPunches[i].type === PunchType.CLOCK_IN &&
          staffPunches[i + 1].type === PunchType.CLOCK_OUT
        ) {
          const hours =
            (staffPunches[i + 1].timestamp.getTime() - staffPunches[i].timestamp.getTime()) /
            (1000 * 60 * 60);
          s.hours_logged += hours;
          i++; // skip the CLOCK_OUT
        }
      }
    }

    // Fetch staff names
    const staffIds = Array.from(staffMap.keys());
    const users = await this.userDal.find({
      findOptions: { org_id: orgId } as never,
      transactionOptions: { useTransaction: false },
    });
    const nameMap = new Map<string, string>();
    for (const user of users.payload) {
      nameMap.set(user.id, user.name);
    }

    // Build result
    const staff: StaffUtilizationRow[] = staffIds.map((staffId) => {
      const s = staffMap.get(staffId)!;
      return {
        staff_id: staffId,
        staff_name: nameMap.get(staffId) ?? 'Unknown',
        hours_logged: Math.round(s.hours_logged * 100) / 100,
        units_delivered: s.units_delivered,
        shifts_scheduled: s.shifts_scheduled,
        shifts_completed: s.shifts_completed,
        shift_fulfillment_rate_percent: s.shifts_scheduled > 0
          ? Math.round((s.shifts_completed / s.shifts_scheduled) * 10000) / 100
          : 0,
        service_records_submitted: s.service_records_submitted,
      };
    });

    const totalHours = staff.reduce((sum, s) => sum + s.hours_logged, 0);
    const totalUnits = staff.reduce((sum, s) => sum + s.units_delivered, 0);

    return {
      staff,
      total_hours_logged: Math.round(totalHours * 100) / 100,
      total_units_delivered: totalUnits,
      avg_hours_per_staff: staff.length > 0
        ? Math.round((totalHours / staff.length) * 100) / 100
        : 0,
    };
  }
}
