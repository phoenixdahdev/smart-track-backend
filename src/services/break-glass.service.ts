import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BreakGlassSessionDal } from '@dals/break-glass-session.dal';
import { AuditLogService } from './audit-log.service';
import { type RequestBreakGlassDto } from '@dtos/request-break-glass.dto';
import { type PaginationValidator } from '@utils/pagination-utils';
import { NotificationTriggerService } from './notification-trigger.service';

@Injectable()
export class BreakGlassService {
  constructor(
    private readonly sessionDal: BreakGlassSessionDal,
    private readonly auditLogService: AuditLogService,
    private readonly notificationTriggerService: NotificationTriggerService,
  ) {}

  async request(
    dto: RequestBreakGlassDto,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const session = await this.sessionDal.create({
      createPayload: {
        operator_id: operatorId,
        org_id: dto.org_id,
        ticket_id: dto.ticket_id,
        reason: dto.reason,
        data_scope: dto.data_scope,
        start_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'SUPPORT_ENGINEER',
      action: 'BREAK_GLASS_REQUESTED',
      target_type: 'break_glass_sessions',
      target_id: session.id,
      after_val: { org_id: dto.org_id, ticket_id: dto.ticket_id, data_scope: dto.data_scope },
      ip_address: ip,
      user_agent: ua,
    });

    this.notificationTriggerService
      .onBreakGlassRequested(dto.org_id, session.id)
      .catch(() => {});

    return session;
  }

  async approve(
    sessionId: string,
    approverId: string,
    ip: string,
    ua: string,
  ) {
    const session = await this.findById(sessionId);

    if (session.operator_id === approverId) {
      throw new BadRequestException('Cannot self-approve break-glass sessions');
    }

    if (session.approved_by) {
      throw new BadRequestException('Session already approved');
    }

    const updated = await this.sessionDal.update({
      identifierOptions: { id: sessionId } as never,
      updatePayload: {
        approved_by: approverId,
        approved_at: new Date(),
        start_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: approverId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'BREAK_GLASS_APPROVED',
      target_type: 'break_glass_sessions',
      target_id: sessionId,
      after_val: { approved_by: approverId },
      ip_address: ip,
      user_agent: ua,
    });

    this.notificationTriggerService
      .onBreakGlassApproved(session.org_id, sessionId)
      .catch(() => {});

    return updated;
  }

  async end(
    sessionId: string,
    operatorId: string,
    actionsSummary: string,
    ip: string,
    ua: string,
  ) {
    await this.findById(sessionId);

    const updated = await this.sessionDal.update({
      identifierOptions: { id: sessionId } as never,
      updatePayload: {
        end_at: new Date(),
        actions_summary: actionsSummary,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'SUPPORT_ENGINEER',
      action: 'BREAK_GLASS_ENDED',
      target_type: 'break_glass_sessions',
      target_id: sessionId,
      after_val: { actions_summary: actionsSummary },
      ip_address: ip,
      user_agent: ua,
    });

    return updated;
  }

  async list(pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.sessionDal.find({
      findOptions: {} as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async findById(id: string) {
    const session = await this.sessionDal.get({
      identifierOptions: { id } as never,
    });

    if (!session) {
      throw new NotFoundException();
    }

    return session;
  }

  async getActiveByOrg(orgId: string) {
    return this.sessionDal.find({
      findOptions: { org_id: orgId, end_at: null } as never,
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }
}
