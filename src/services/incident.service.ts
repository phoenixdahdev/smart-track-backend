import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IncidentDal } from '@dals/incident.dal';
import { EncryptionService } from './encryption.service';
import { AuditLogService } from './audit-log.service';
import { NotificationTriggerService } from './notification-trigger.service';
import { type CreateIncidentDto } from '@dtos/create-incident.dto';
import { type UpdateIncidentDto } from '@dtos/update-incident.dto';
import { type IncidentEntity } from '@entities/incident.entity';
import {
  IncidentStatus,
  INCIDENT_TRANSITIONS,
} from '@enums/incident-status.enum';
import { validateTransition } from '@utils/state-machine';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class IncidentService {
  private readonly logger = new Logger(IncidentService.name);

  constructor(
    private readonly incidentDal: IncidentDal,
    private readonly encryptionService: EncryptionService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationTriggerService: NotificationTriggerService,
  ) {}

  private encryptPhiFields(
    dto: Partial<
      Pick<CreateIncidentDto, 'description' | 'immediate_action'> & {
        supervisor_comments?: string;
      }
    >,
  ): Record<string, string | null | undefined> {
    const result: Record<string, string | null | undefined> = {};

    if (dto.description !== undefined) {
      result.description = dto.description
        ? this.encryptionService.encrypt(dto.description)
        : null;
    }
    if (dto.immediate_action !== undefined) {
      result.immediate_action = dto.immediate_action
        ? this.encryptionService.encrypt(dto.immediate_action)
        : null;
    }
    if (dto.supervisor_comments !== undefined) {
      result.supervisor_comments = dto.supervisor_comments
        ? this.encryptionService.encrypt(dto.supervisor_comments)
        : null;
    }

    return result;
  }

  private decryptField(
    value: string | null | undefined,
    fieldName: string,
  ): string | null {
    if (!value) return null;
    try {
      return this.encryptionService.decrypt(value);
    } catch {
      this.logger.warn(
        `Failed to decrypt field "${fieldName}" for incident — returning null`,
      );
      return null;
    }
  }

  private decryptFields(incident: IncidentEntity): IncidentEntity {
    return {
      ...incident,
      description: this.decryptField(incident.description, 'description') ?? '',
      immediate_action: this.decryptField(
        incident.immediate_action,
        'immediate_action',
      ),
      supervisor_comments: this.decryptField(
        incident.supervisor_comments,
        'supervisor_comments',
      ),
    };
  }

  async create(
    dto: CreateIncidentDto,
    orgId: string,
    reportedBy: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const encrypted = this.encryptPhiFields(dto);

    const incident = await this.incidentDal.create({
      createPayload: {
        org_id: orgId,
        individual_id: dto.individual_id,
        reported_by: reportedBy,
        type: dto.type,
        description: encrypted.description ?? '',
        immediate_action: encrypted.immediate_action ?? null,
        status: IncidentStatus.DRAFT,
        occurred_at: new Date(dto.occurred_at),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: reportedBy,
      user_role: userRole,
      action: 'INCIDENT_CREATED',
      action_type: 'CREATE',
      table_name: 'incidents',
      record_id: incident.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(incident);
  }

  async findById(
    id: string,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const incident = await this.incidentDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!incident) {
      throw new NotFoundException();
    }

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'INCIDENT_ACCESSED',
      action_type: 'READ',
      table_name: 'incidents',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(incident);
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateIncidentDto,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const incident = await this.incidentDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!incident) {
      throw new NotFoundException();
    }

    if (incident.status !== IncidentStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT incidents can be updated');
    }

    const encrypted = this.encryptPhiFields(dto);
    const updatePayload: Record<string, unknown> = {};
    if (dto.type !== undefined) updatePayload.type = dto.type;
    if (encrypted.description !== undefined)
      updatePayload.description = encrypted.description;
    if (encrypted.immediate_action !== undefined)
      updatePayload.immediate_action = encrypted.immediate_action;

    const updated = await this.incidentDal.update({
      identifierOptions: { id } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'INCIDENT_UPDATED',
      action_type: 'UPDATE',
      table_name: 'incidents',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated ? this.decryptFields(updated) : null;
  }

  private async transitionStatus(
    id: string,
    orgId: string,
    toStatus: IncidentStatus,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
    extraPayload?: Record<string, unknown>,
  ) {
    const incident = await this.incidentDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!incident) {
      throw new NotFoundException();
    }

    const canTransition = validateTransition(
      INCIDENT_TRANSITIONS,
      incident.status,
      toStatus,
    );

    if (!canTransition) {
      throw new BadRequestException(
        `Cannot transition from ${incident.status} to ${toStatus}`,
      );
    }

    const updatePayload: Record<string, unknown> = {
      status: toStatus,
      ...extraPayload,
    };

    const updated = await this.incidentDal.update({
      identifierOptions: { id } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: `INCIDENT_${toStatus}`,
      action_type: 'UPDATE',
      table_name: 'incidents',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated ? this.decryptFields(updated) : null;
  }

  async submit(
    id: string,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const incident = await this.transitionStatus(
      id,
      orgId,
      IncidentStatus.SUBMITTED,
      userId,
      userRole,
      ip,
      userAgent,
    );

    if (incident) {
      this.notificationTriggerService
        .onIncidentReportedForGuardian(orgId, incident.individual_id, id)
        .catch(() => {});
    }

    return incident;
  }

  async startReview(
    id: string,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    return this.transitionStatus(
      id,
      orgId,
      IncidentStatus.UNDER_REVIEW,
      userId,
      userRole,
      ip,
      userAgent,
    );
  }

  async close(
    id: string,
    orgId: string,
    supervisorComments: string | undefined,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const encrypted = this.encryptPhiFields({
      supervisor_comments: supervisorComments,
    });

    return this.transitionStatus(
      id,
      orgId,
      IncidentStatus.CLOSED,
      userId,
      userRole,
      ip,
      userAgent,
      encrypted.supervisor_comments !== undefined
        ? { supervisor_comments: encrypted.supervisor_comments }
        : undefined,
    );
  }

  async listByIndividual(
    individualId: string,
    orgId: string,
    pagination?: PaginationValidator,
    statusFilter?: IncidentStatus,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {
      individual_id: individualId,
      org_id: orgId,
    };
    if (statusFilter) {
      findOptions.status = statusFilter;
    }

    const result = await this.incidentDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { occurred_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return {
      payload: result.payload.map((i) => this.decryptFields(i)),
      paginationMeta: result.paginationMeta,
    };
  }

  async listAll(
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const result = await this.incidentDal.find({
      findOptions: { org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { occurred_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return {
      payload: result.payload.map((i) => this.decryptFields(i)),
      paginationMeta: result.paginationMeta,
    };
  }

  async listPendingReview(orgId: string, pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const result = await this.incidentDal.find({
      findOptions: {
        org_id: orgId,
        status: IncidentStatus.SUBMITTED,
      } as never,
      paginationPayload: { page, limit },
      order: { occurred_at: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return {
      payload: result.payload.map((i) => this.decryptFields(i)),
      paginationMeta: result.paginationMeta,
    };
  }
}
