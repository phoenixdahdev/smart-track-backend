import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GuardianIndividualDal } from '@dals/guardian-individual.dal';
import { IndividualDal } from '@dals/individual.dal';
import { ServiceRecordDal } from '@dals/service-record.dal';
import { DailyNoteDal } from '@dals/daily-note.dal';
import { IspGoalDal } from '@dals/isp-goal.dal';
import { IspDataPointDal } from '@dals/isp-data-point.dal';
import { IncidentDal } from '@dals/incident.dal';
import { ShiftDal } from '@dals/shift.dal';
import { MarEntryDal } from '@dals/mar-entry.dal';
import { AdlEntryDal } from '@dals/adl-entry.dal';
import { AdlCategoryDal } from '@dals/adl-category.dal';
import { EncryptionService } from './encryption.service';
import { AuditLogService } from './audit-log.service';
import { NotificationService } from './notification.service';
import { type PaginationValidator } from '@utils/pagination-utils';
import {
  type RedactedIndividualSummary,
  type RedactedIndividualProfile,
  type RedactedServiceRecordSummary,
  type RedactedIncidentSummary,
  type RedactedIspGoalSummary,
  type RedactedIspDataPoint,
  type RedactedShiftSummary,
  type RedactedMarSummary,
  type RedactedAdlSummary,
  type GuardianDashboardData,
} from '@app-types/guardian-portal.types';
import { type PortalServiceRecordQueryDto } from '@dtos/portal-service-record-query.dto';
import { type PortalIncidentQueryDto } from '@dtos/portal-incident-query.dto';
import { type PortalScheduleQueryDto } from '@dtos/portal-schedule-query.dto';
import { type PortalMarQueryDto } from '@dtos/portal-mar-query.dto';
import { type PortalIspQueryDto } from '@dtos/portal-isp-query.dto';
import { MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';

@Injectable()
export class GuardianPortalService {
  private readonly logger = new Logger(GuardianPortalService.name);

  constructor(
    private readonly guardianIndividualDal: GuardianIndividualDal,
    private readonly individualDal: IndividualDal,
    private readonly serviceRecordDal: ServiceRecordDal,
    private readonly dailyNoteDal: DailyNoteDal,
    private readonly ispGoalDal: IspGoalDal,
    private readonly ispDataPointDal: IspDataPointDal,
    private readonly incidentDal: IncidentDal,
    private readonly shiftDal: ShiftDal,
    private readonly marEntryDal: MarEntryDal,
    private readonly adlEntryDal: AdlEntryDal,
    private readonly adlCategoryDal: AdlCategoryDal,
    private readonly encryptionService: EncryptionService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService,
  ) {}

  async validateGuardianAccess(
    guardianId: string,
    individualId: string,
    orgId: string,
  ): Promise<void> {
    const link = await this.guardianIndividualDal.get({
      identifierOptions: {
        guardian_id: guardianId,
        individual_id: individualId,
        org_id: orgId,
        active: true,
      } as never,
    });

    if (!link) {
      throw new NotFoundException();
    }
  }

  async getLinkedIndividuals(
    guardianId: string,
    orgId: string,
    pagination?: PaginationValidator,
    activeOnly = true,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {
      guardian_id: guardianId,
      org_id: orgId,
    };
    if (activeOnly) {
      findOptions.active = true;
    }

    const result = await this.guardianIndividualDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const summaries: RedactedIndividualSummary[] = [];
    for (const link of result.payload) {
      const individual = await this.individualDal.get({
        identifierOptions: { id: link.individual_id, org_id: orgId } as never,
      });

      if (individual) {
        summaries.push({
          id: individual.id,
          first_name: this.decryptField(individual.first_name, 'first_name'),
          last_name: this.decryptField(individual.last_name, 'last_name'),
          active: individual.active,
          relationship: link.relationship,
        });
      }
    }

    return { payload: summaries, paginationMeta: result.paginationMeta };
  }

  async getIndividualProfile(
    guardianId: string,
    individualId: string,
    orgId: string,
    auditCtx: { userId: string; userRole: string; ip: string; userAgent: string },
  ) {
    await this.validateGuardianAccess(guardianId, individualId, orgId);

    const individual = await this.individualDal.get({
      identifierOptions: { id: individualId, org_id: orgId } as never,
    });

    if (!individual) {
      throw new NotFoundException();
    }

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: auditCtx.userId,
      user_role: auditCtx.userRole,
      action: 'GUARDIAN_INDIVIDUAL_PROFILE_ACCESSED',
      action_type: 'READ',
      table_name: 'individuals',
      record_id: individualId,
      ip_address: auditCtx.ip,
      user_agent: auditCtx.userAgent,
    });

    const profile: RedactedIndividualProfile = {
      id: individual.id,
      first_name: this.decryptField(individual.first_name, 'first_name'),
      last_name: this.decryptField(individual.last_name, 'last_name'),
      age: this.computeAge(individual.date_of_birth),
      active: individual.active,
    };

    return profile;
  }

  async getDashboard(
    guardianId: string,
    individualId: string,
    orgId: string,
  ): Promise<GuardianDashboardData> {
    await this.validateGuardianAccess(guardianId, individualId, orgId);

    const individual = await this.individualDal.get({
      identifierOptions: { id: individualId, org_id: orgId } as never,
    });

    if (!individual) {
      throw new NotFoundException();
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const sevenDaysFromNowStr = sevenDaysFromNow.toISOString().split('T')[0];

    const [recentServices, upcomingShifts, activeGoals, recentIncidents, unreadCount] =
      await Promise.all([
        this.serviceRecordDal.find({
          findOptions: {
            individual_id: individualId,
            org_id: orgId,
            service_date: Between(sevenDaysAgoStr, todayStr),
          } as never,
          transactionOptions: { useTransaction: false },
        }),
        this.shiftDal.find({
          findOptions: {
            individual_id: individualId,
            org_id: orgId,
            shift_date: Between(todayStr, sevenDaysFromNowStr),
          } as never,
          transactionOptions: { useTransaction: false },
        }),
        this.ispGoalDal.find({
          findOptions: {
            individual_id: individualId,
            org_id: orgId,
            active: true,
          } as never,
          transactionOptions: { useTransaction: false },
        }),
        this.incidentDal.find({
          findOptions: {
            individual_id: individualId,
            org_id: orgId,
            occurred_at: MoreThanOrEqual(thirtyDaysAgo),
          } as never,
          transactionOptions: { useTransaction: false },
        }),
        this.notificationService.getUnreadCount(guardianId, orgId),
      ]);

    return {
      individual_id: individual.id,
      individual_name: `${this.decryptField(individual.first_name, 'first_name')} ${this.decryptField(individual.last_name, 'last_name')}`,
      recent_service_count: recentServices.payload.length,
      upcoming_shift_count: upcomingShifts.payload.length,
      active_isp_goals: activeGoals.payload.length,
      recent_incident_count: recentIncidents.payload.length,
      unread_notification_count: unreadCount.count,
    };
  }

  async getServiceRecordSummaries(
    guardianId: string,
    individualId: string,
    orgId: string,
    query: PortalServiceRecordQueryDto,
  ) {
    await this.validateGuardianAccess(guardianId, individualId, orgId);

    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {
      individual_id: individualId,
      org_id: orgId,
    };

    if (query.status) {
      findOptions.status = query.status;
    }

    if (query.from_date && query.to_date) {
      findOptions.service_date = Between(query.from_date, query.to_date);
    } else if (query.from_date) {
      findOptions.service_date = MoreThanOrEqual(query.from_date);
    } else if (query.to_date) {
      findOptions.service_date = LessThanOrEqual(query.to_date);
    }

    const result = await this.serviceRecordDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { service_date: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const summaries: RedactedServiceRecordSummary[] = [];
    for (const record of result.payload) {
      const dailyNotes = await this.dailyNoteDal.find({
        findOptions: {
          service_record_id: record.id,
          org_id: orgId,
        } as never,
        transactionOptions: { useTransaction: false },
      });

      summaries.push({
        id: record.id,
        service_date: record.service_date,
        units_delivered: Number(record.units_delivered),
        status: record.status,
        program_id: record.program_id,
        has_daily_notes: dailyNotes.payload.length > 0,
      });
    }

    return { payload: summaries, paginationMeta: result.paginationMeta };
  }

  async getIncidentSummaries(
    guardianId: string,
    individualId: string,
    orgId: string,
    query: PortalIncidentQueryDto,
  ) {
    await this.validateGuardianAccess(guardianId, individualId, orgId);

    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {
      individual_id: individualId,
      org_id: orgId,
    };

    if (query.status) {
      findOptions.status = query.status;
    }

    const result = await this.incidentDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { occurred_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const summaries: RedactedIncidentSummary[] = result.payload.map((i) => ({
      id: i.id,
      type: i.type,
      occurred_at: i.occurred_at,
      status: i.status,
    }));

    return { payload: summaries, paginationMeta: result.paginationMeta };
  }

  async getIspGoals(
    guardianId: string,
    individualId: string,
    orgId: string,
    query: PortalIspQueryDto,
  ) {
    await this.validateGuardianAccess(guardianId, individualId, orgId);

    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {
      individual_id: individualId,
      org_id: orgId,
    };

    if (query.active_only) {
      findOptions.active = true;
    }

    const result = await this.ispGoalDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { effective_start: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const summaries: RedactedIspGoalSummary[] = [];
    for (const goal of result.payload) {
      const dataPoints = await this.ispDataPointDal.find({
        findOptions: { goal_id: goal.id, org_id: orgId } as never,
        transactionOptions: { useTransaction: false },
      });

      summaries.push({
        id: goal.id,
        description: this.decryptField(goal.description, 'description'),
        target: goal.target,
        effective_start: goal.effective_start,
        effective_end: goal.effective_end,
        active: goal.active,
        data_point_count: dataPoints.payload.length,
      });
    }

    return { payload: summaries, paginationMeta: result.paginationMeta };
  }

  async getIspGoalProgress(
    guardianId: string,
    individualId: string,
    goalId: string,
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    await this.validateGuardianAccess(guardianId, individualId, orgId);

    const goal = await this.ispGoalDal.get({
      identifierOptions: { id: goalId, individual_id: individualId, org_id: orgId } as never,
    });

    if (!goal) {
      throw new NotFoundException();
    }

    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const result = await this.ispDataPointDal.find({
      findOptions: { goal_id: goalId, org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { recorded_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const dataPoints: RedactedIspDataPoint[] = result.payload.map((dp) => ({
      id: dp.id,
      value: dp.value,
      recorded_at: dp.recorded_at,
    }));

    return { payload: dataPoints, paginationMeta: result.paginationMeta };
  }

  async getUpcomingSchedule(
    guardianId: string,
    individualId: string,
    orgId: string,
    query: PortalScheduleQueryDto,
  ) {
    await this.validateGuardianAccess(guardianId, individualId, orgId);

    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {
      individual_id: individualId,
      org_id: orgId,
    };

    if (query.from_date && query.to_date) {
      findOptions.shift_date = Between(query.from_date, query.to_date);
    } else if (query.from_date) {
      findOptions.shift_date = MoreThanOrEqual(query.from_date);
    } else if (query.to_date) {
      findOptions.shift_date = LessThanOrEqual(query.to_date);
    } else {
      const today = new Date().toISOString().split('T')[0];
      findOptions.shift_date = MoreThanOrEqual(today);
    }

    const result = await this.shiftDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { shift_date: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const summaries: RedactedShiftSummary[] = result.payload.map((s) => ({
      id: s.id,
      shift_date: s.shift_date,
      start_time: s.start_time,
      end_time: s.end_time,
      status: s.status,
    }));

    return { payload: summaries, paginationMeta: result.paginationMeta };
  }

  async getMarSummaries(
    guardianId: string,
    individualId: string,
    orgId: string,
    query: PortalMarQueryDto,
  ) {
    await this.validateGuardianAccess(guardianId, individualId, orgId);

    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {
      individual_id: individualId,
      org_id: orgId,
    };

    if (query.from_date && query.to_date) {
      findOptions.scheduled_time = Between(
        new Date(query.from_date),
        new Date(query.to_date + 'T23:59:59.999Z'),
      );
    } else if (query.from_date) {
      findOptions.scheduled_time = MoreThanOrEqual(new Date(query.from_date));
    } else if (query.to_date) {
      findOptions.scheduled_time = LessThanOrEqual(
        new Date(query.to_date + 'T23:59:59.999Z'),
      );
    }

    const result = await this.marEntryDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { scheduled_time: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const summaries: RedactedMarSummary[] = result.payload.map((m) => ({
      id: m.id,
      drug_name: this.decryptField(m.drug_name, 'drug_name'),
      scheduled_time: m.scheduled_time,
      administered_time: m.administered_time,
      result: m.result,
    }));

    return { payload: summaries, paginationMeta: result.paginationMeta };
  }

  async getAdlSummaries(
    guardianId: string,
    individualId: string,
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    await this.validateGuardianAccess(guardianId, individualId, orgId);

    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const result = await this.adlEntryDal.find({
      findOptions: {
        individual_id: individualId,
        org_id: orgId,
      } as never,
      paginationPayload: { page, limit },
      order: { recorded_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const summaries: RedactedAdlSummary[] = [];
    for (const entry of result.payload) {
      const category = await this.adlCategoryDal.get({
        identifierOptions: { id: entry.adl_category_id, org_id: orgId } as never,
      });

      summaries.push({
        id: entry.id,
        category_name: category?.name ?? 'Unknown',
        assistance_level: entry.assistance_level,
        recorded_at: entry.recorded_at,
      });
    }

    return { payload: summaries, paginationMeta: result.paginationMeta };
  }

  private decryptField(value: string | null | undefined, fieldName: string): string {
    if (!value) return '';
    try {
      return this.encryptionService.decrypt(value);
    } catch {
      this.logger.warn(
        `Failed to decrypt field "${fieldName}" for guardian portal — returning raw value`,
      );
      return value;
    }
  }

  private computeAge(dateOfBirth: string): number {
    let dob: string;
    try {
      dob = this.encryptionService.decrypt(dateOfBirth);
    } catch {
      dob = dateOfBirth;
    }

    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}
