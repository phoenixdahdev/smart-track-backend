import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceAuthorizationDal } from '@dals/service-authorization.dal';
import { PayerConfigDal } from '@dals/payer-config.dal';
import { ServiceCodeDal } from '@dals/service-code.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateServiceAuthorizationDto } from '@dtos/create-service-authorization.dto';
import { type UpdateServiceAuthorizationDto } from '@dtos/update-service-authorization.dto';
import { type PaginationValidator } from '@utils/pagination-utils';
import { AuthorizationStatus } from '@enums/authorization-status.enum';
import { NotificationTriggerService } from './notification-trigger.service';

@Injectable()
export class ServiceAuthorizationService {
  constructor(
    private readonly serviceAuthorizationDal: ServiceAuthorizationDal,
    private readonly payerConfigDal: PayerConfigDal,
    private readonly serviceCodeDal: ServiceCodeDal,
    private readonly auditLogService: AuditLogService,
    private readonly notificationTriggerService: NotificationTriggerService,
  ) {}

  async create(
    dto: CreateServiceAuthorizationDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const record = await this.serviceAuthorizationDal.create({
      createPayload: {
        org_id: orgId,
        individual_id: dto.individual_id,
        payer_config_id: dto.payer_config_id,
        service_code_id: dto.service_code_id,
        auth_number: dto.auth_number,
        units_authorized: dto.units_authorized,
        units_used: 0,
        units_pending: 0,
        unit_type: dto.unit_type,
        start_date: dto.start_date,
        end_date: dto.end_date,
        rendering_provider_npi: dto.rendering_provider_npi ?? null,
        status: AuthorizationStatus.ACTIVE,
        notes: dto.notes ?? null,
        created_by: userId,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'SERVICE_AUTH_CREATED',
      action_type: 'CREATE',
      table_name: 'service_authorizations',
      record_id: record.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return record;
  }

  async findById(id: string, orgId: string) {
    const record = await this.serviceAuthorizationDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!record) {
      throw new NotFoundException();
    }

    return record;
  }

  async list(
    orgId: string,
    pagination?: PaginationValidator,
    filters?: { individual_id?: string; status?: AuthorizationStatus },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.individual_id)
      findOptions.individual_id = filters.individual_id;
    if (filters?.status) findOptions.status = filters.status;

    return this.serviceAuthorizationDal.find({
      findOptions: findOptions as never,
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

    return this.serviceAuthorizationDal.find({
      findOptions: { org_id: orgId, individual_id: individualId } as never,
      paginationPayload: { page, limit },
      order: { start_date: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async update(
    id: string,
    dto: UpdateServiceAuthorizationDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const existing = await this.findById(id, orgId);

    if (existing.status === AuthorizationStatus.VOIDED) {
      throw new BadRequestException('Cannot update a voided authorization');
    }

    const updated = await this.serviceAuthorizationDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'SERVICE_AUTH_UPDATED',
      action_type: 'UPDATE',
      table_name: 'service_authorizations',
      record_id: id,
      before_val: existing as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: userAgent,
    });

    this.notificationTriggerService
      .onAuthUtilizationChanged(orgId, id)
      .catch(() => {});

    return updated;
  }

  async void(
    id: string,
    orgId: string,
    userId: string,
    userRole: string,
    reason: string,
    ip: string,
    userAgent: string,
  ) {
    const existing = await this.findById(id, orgId);

    if (existing.status === AuthorizationStatus.VOIDED) {
      throw new BadRequestException('Authorization is already voided');
    }

    const updated = await this.serviceAuthorizationDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: {
        status: AuthorizationStatus.VOIDED,
        notes: reason,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'SERVICE_AUTH_VOIDED',
      action_type: 'UPDATE',
      table_name: 'service_authorizations',
      record_id: id,
      before_val: existing as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async findAuthForBilling(
    individualId: string,
    serviceCodeId: string,
    serviceDate: string,
    orgId: string,
  ) {
    const auths = await this.serviceAuthorizationDal.find({
      findOptions: {
        org_id: orgId,
        individual_id: individualId,
        service_code_id: serviceCodeId,
        status: AuthorizationStatus.ACTIVE,
      } as never,
      order: { start_date: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const matching = auths.payload.find((auth) => {
      return serviceDate >= auth.start_date && serviceDate <= auth.end_date;
    });

    return matching ?? null;
  }

  async incrementUnitsUsed(
    authId: string,
    orgId: string,
    unitsToAdd: number,
  ) {
    const auth = await this.findById(authId, orgId);

    const newUsed = Number(auth.units_used) + unitsToAdd;

    const updated = await this.serviceAuthorizationDal.update({
      identifierOptions: { id: authId, org_id: orgId } as never,
      updatePayload: { units_used: newUsed } as never,
      transactionOptions: { useTransaction: false },
    });

    return updated;
  }

  async recalculateUnits(authId: string, orgId: string) {
    const auth = await this.findById(authId, orgId);
    return auth;
  }

  async checkThresholds(authId: string, orgId: string) {
    const auth = await this.findById(authId, orgId);

    const totalUsed =
      Number(auth.units_used) + Number(auth.units_pending);
    const authorized = Number(auth.units_authorized);

    const alerts: { type: string; message: string }[] = [];

    if (authorized > 0) {
      const usagePercent = (totalUsed / authorized) * 100;

      if (totalUsed > authorized) {
        alerts.push({
          type: 'EXCEEDED',
          message: `Authorization exceeded: ${totalUsed}/${authorized} units used`,
        });
      } else if (usagePercent >= 95) {
        alerts.push({
          type: 'NEAR_LIMIT_95',
          message: `Authorization at ${usagePercent.toFixed(1)}%: ${totalUsed}/${authorized} units`,
        });
      } else if (usagePercent >= 80) {
        alerts.push({
          type: 'NEAR_LIMIT_80',
          message: `Authorization at ${usagePercent.toFixed(1)}%: ${totalUsed}/${authorized} units`,
        });
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const endDate = auth.end_date;
    const daysUntilExpiry = Math.ceil(
      (new Date(endDate).getTime() - new Date(today).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      alerts.push({
        type: 'EXPIRING_SOON',
        message: `Authorization expires in ${daysUntilExpiry} days`,
      });
    } else if (daysUntilExpiry <= 0) {
      alerts.push({
        type: 'EXPIRED',
        message: 'Authorization has expired',
      });
    }

    return { auth, alerts };
  }
}
