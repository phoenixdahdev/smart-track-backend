import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EvvPunchDal } from '@dals/evv-punch.dal';
import { StaffAssignmentDal } from '@dals/staff-assignment.dal';
import { SiteDal } from '@dals/site.dal';
import { ServiceRecordDal } from '@dals/service-record.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateEvvPunchDto } from '@dtos/create-evv-punch.dto';
import { type EvvPunchEntity } from '@entities/evv-punch.entity';
import { PunchType } from '@enums/punch-type.enum';
import { isWithinRadius } from '@utils/gps-distance';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class EvvPunchService {
  constructor(
    private readonly evvPunchDal: EvvPunchDal,
    private readonly staffAssignmentDal: StaffAssignmentDal,
    private readonly siteDal: SiteDal,
    private readonly serviceRecordDal: ServiceRecordDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async clockIn(
    dto: CreateEvvPunchDto,
    orgId: string,
    staffId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const assignment = await this.staffAssignmentDal.get({
      identifierOptions: {
        staff_id: staffId,
        individual_id: dto.individual_id,
        org_id: orgId,
        active: true,
      } as never,
    });

    if (!assignment) {
      throw new BadRequestException(
        'Staff member is not assigned to this individual',
      );
    }

    // Prevent double clock-in
    const openSession = await this.findOpenSession(
      staffId,
      dto.individual_id,
      orgId,
    );
    if (openSession) {
      throw new BadRequestException(
        'Staff already has an open clock-in for this individual',
      );
    }

    const locationConfirmed = await this.validateGps(
      dto.gps_latitude,
      dto.gps_longitude,
      orgId,
    );

    const punch = await this.evvPunchDal.create({
      createPayload: {
        org_id: orgId,
        staff_id: staffId,
        individual_id: dto.individual_id,
        shift_id: dto.shift_id ?? null,
        punch_type: PunchType.CLOCK_IN,
        timestamp: new Date(),
        gps_latitude: dto.gps_latitude ?? null,
        gps_longitude: dto.gps_longitude ?? null,
        location_confirmed: locationConfirmed,
        device_id: dto.device_id ?? null,
        notes: dto.notes ?? null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: staffId,
      user_role: userRole,
      action: 'EVV_CLOCK_IN',
      action_type: 'CREATE',
      table_name: 'evv_punches',
      record_id: punch.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return punch;
  }

  async clockOut(
    dto: CreateEvvPunchDto,
    orgId: string,
    staffId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const openSession = await this.findOpenSession(
      staffId,
      dto.individual_id,
      orgId,
    );

    if (!openSession) {
      throw new BadRequestException(
        'No open clock-in found for this individual',
      );
    }

    const locationConfirmed = await this.validateGps(
      dto.gps_latitude,
      dto.gps_longitude,
      orgId,
    );

    const punch = await this.evvPunchDal.create({
      createPayload: {
        org_id: orgId,
        staff_id: staffId,
        individual_id: dto.individual_id,
        shift_id: dto.shift_id ?? openSession.shift_id,
        punch_type: PunchType.CLOCK_OUT,
        timestamp: new Date(),
        gps_latitude: dto.gps_latitude ?? null,
        gps_longitude: dto.gps_longitude ?? null,
        location_confirmed: locationConfirmed,
        device_id: dto.device_id ?? null,
        notes: dto.notes ?? null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: staffId,
      user_role: userRole,
      action: 'EVV_CLOCK_OUT',
      action_type: 'CREATE',
      table_name: 'evv_punches',
      record_id: punch.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return punch;
  }

  async findById(id: string, orgId: string) {
    const punch = await this.evvPunchDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!punch) {
      throw new NotFoundException();
    }

    return punch;
  }

  async findByIdForStaff(id: string, orgId: string, staffId: string) {
    const punch = await this.evvPunchDal.get({
      identifierOptions: { id, org_id: orgId, staff_id: staffId } as never,
    });

    if (!punch) {
      throw new NotFoundException();
    }

    return punch;
  }

  async listByStaff(
    staffId: string,
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {
      staff_id: staffId,
      org_id: orgId,
    };

    return this.evvPunchDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { timestamp: 'DESC' } as never,
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

    return this.evvPunchDal.find({
      findOptions: { individual_id: individualId, org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { timestamp: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async listAll(
    orgId: string,
    pagination?: PaginationValidator,
    filters?: {
      staff_id?: string;
      individual_id?: string;
      punch_type?: PunchType;
    },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.staff_id) findOptions.staff_id = filters.staff_id;
    if (filters?.individual_id)
      findOptions.individual_id = filters.individual_id;
    if (filters?.punch_type) findOptions.punch_type = filters.punch_type;

    return this.evvPunchDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { timestamp: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async findMissedPunches(orgId: string, thresholdHours: number = 12) {
    const allClockIns = await this.evvPunchDal.find({
      findOptions: {
        org_id: orgId,
        punch_type: PunchType.CLOCK_IN,
      } as never,
      order: { timestamp: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const threshold = new Date();
    threshold.setHours(threshold.getHours() - thresholdHours);

    const missedPunches: EvvPunchEntity[] = [];

    for (const clockIn of allClockIns.payload) {
      if (new Date(clockIn.timestamp) > threshold) continue;

      const matchingClockOut = await this.evvPunchDal.find({
        findOptions: {
          org_id: orgId,
          staff_id: clockIn.staff_id,
          individual_id: clockIn.individual_id,
          punch_type: PunchType.CLOCK_OUT,
        } as never,
        order: { timestamp: 'DESC' } as never,
        transactionOptions: { useTransaction: false },
      });

      const hasClockOut = matchingClockOut.payload.some(
        (co) => new Date(co.timestamp) > new Date(clockIn.timestamp),
      );

      if (!hasClockOut) {
        missedPunches.push(clockIn);
      }
    }

    return missedPunches;
  }

  async linkToServiceRecord(
    serviceRecordId: string,
    punchInId: string,
    punchOutId: string,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const serviceRecord = await this.serviceRecordDal.get({
      identifierOptions: { id: serviceRecordId, org_id: orgId } as never,
    });

    if (!serviceRecord) {
      throw new NotFoundException('Service record not found');
    }

    const punchIn = await this.evvPunchDal.get({
      identifierOptions: { id: punchInId, org_id: orgId } as never,
    });

    if (!punchIn) {
      throw new NotFoundException('Clock-in punch not found');
    }

    if (punchIn.punch_type !== PunchType.CLOCK_IN) {
      throw new BadRequestException('Specified punch-in is not a CLOCK_IN');
    }

    const punchOut = await this.evvPunchDal.get({
      identifierOptions: { id: punchOutId, org_id: orgId } as never,
    });

    if (!punchOut) {
      throw new NotFoundException('Clock-out punch not found');
    }

    if (punchOut.punch_type !== PunchType.CLOCK_OUT) {
      throw new BadRequestException('Specified punch-out is not a CLOCK_OUT');
    }

    if (
      punchIn.staff_id !== serviceRecord.staff_id ||
      punchOut.staff_id !== serviceRecord.staff_id
    ) {
      throw new BadRequestException(
        'Punch staff does not match service record staff',
      );
    }

    if (
      punchIn.individual_id !== serviceRecord.individual_id ||
      punchOut.individual_id !== serviceRecord.individual_id
    ) {
      throw new BadRequestException(
        'Punch individual does not match service record individual',
      );
    }

    const updated = await this.serviceRecordDal.update({
      identifierOptions: { id: serviceRecordId } as never,
      updatePayload: {
        evv_punch_in_id: punchInId,
        evv_punch_out_id: punchOutId,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'EVV_LINKED_TO_SERVICE_RECORD',
      action_type: 'UPDATE',
      table_name: 'service_records',
      record_id: serviceRecordId,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async getSummary(orgId: string, dateFrom?: string, dateTo?: string) {
    const allPunches = await this.evvPunchDal.find({
      findOptions: { org_id: orgId } as never,
      order: { timestamp: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    let punches = allPunches.payload;

    if (dateFrom) {
      const from = new Date(dateFrom);
      punches = punches.filter((p) => new Date(p.timestamp) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setDate(to.getDate() + 1);
      punches = punches.filter((p) => new Date(p.timestamp) < to);
    }

    const clockIns = punches.filter(
      (p) => p.punch_type === PunchType.CLOCK_IN,
    );
    const clockOuts = punches.filter(
      (p) => p.punch_type === PunchType.CLOCK_OUT,
    );
    const locationConfirmed = punches.filter(
      (p) => p.location_confirmed,
    ).length;

    const locationRate =
      punches.length > 0
        ? Math.round((locationConfirmed / punches.length) * 100)
        : 0;

    return {
      total_punches: punches.length,
      clock_ins: clockIns.length,
      clock_outs: clockOuts.length,
      location_confirmation_rate: locationRate,
    };
  }

  private async findOpenSession(
    staffId: string,
    individualId: string,
    orgId: string,
  ) {
    const clockIns = await this.evvPunchDal.find({
      findOptions: {
        org_id: orgId,
        staff_id: staffId,
        individual_id: individualId,
        punch_type: PunchType.CLOCK_IN,
      } as never,
      order: { timestamp: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    if (clockIns.payload.length === 0) return null;

    const latestClockIn = clockIns.payload[0];

    const clockOuts = await this.evvPunchDal.find({
      findOptions: {
        org_id: orgId,
        staff_id: staffId,
        individual_id: individualId,
        punch_type: PunchType.CLOCK_OUT,
      } as never,
      order: { timestamp: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const hasMatchingClockOut = clockOuts.payload.some(
      (co) => new Date(co.timestamp) > new Date(latestClockIn.timestamp),
    );

    return hasMatchingClockOut ? null : latestClockIn;
  }

  private async validateGps(
    latitude: number | undefined,
    longitude: number | undefined,
    orgId: string,
  ): Promise<boolean> {
    if (latitude == null || longitude == null) return false;

    const sites = await this.siteDal.find({
      findOptions: { org_id: orgId, active: true } as never,
      transactionOptions: { useTransaction: false },
    });

    for (const site of sites.payload) {
      if (site.latitude != null && site.longitude != null) {
        if (
          isWithinRadius(
            latitude,
            longitude,
            Number(site.latitude),
            Number(site.longitude),
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }
}
