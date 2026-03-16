import { Injectable, NotFoundException } from '@nestjs/common';
import { SignupApplicationDal } from '@dals/signup-application.dal';
import { ApplicationDocumentDal } from '@dals/application-document.dal';
import { ApplicationNoteDal } from '@dals/application-note.dal';
import { AuditLogService } from './audit-log.service';
import { RiskScoringService } from './risk-scoring.service';
import { type SubmitApplicationDto } from '@dtos/submit-application.dto';
import { type PaginationValidator } from '@utils/pagination-utils';
import {
  ApplicationStatus,
  APPLICATION_TRANSITIONS,
} from '@enums/application-status.enum';
import { validateTransition } from '@utils/state-machine';
import { BadRequestException } from '@nestjs/common';
import { type ApplicationSummaryCounts } from '@app-types/superadmin.types';

@Injectable()
export class SignupApplicationService {
  constructor(
    private readonly applicationDal: SignupApplicationDal,
    private readonly documentDal: ApplicationDocumentDal,
    private readonly noteDal: ApplicationNoteDal,
    private readonly auditLogService: AuditLogService,
    private readonly riskScoringService: RiskScoringService,
  ) {}

  async submit(dto: SubmitApplicationDto) {
    const riskResult = this.riskScoringService.calculateRiskScore({
      npi: dto.npi,
      ein: dto.ein,
      contact_email: dto.contact_email,
      plan_tier: dto.plan_tier ?? null,
    });

    const scoreValue =
      riskResult.score === 'HIGH' ? 3 : riskResult.score === 'MEDIUM' ? 2 : 1;

    const application = await this.applicationDal.create({
      createPayload: {
        ...dto,
        contact_phone: dto.contact_phone ?? null,
        plan_tier: dto.plan_tier ?? null,
        status: ApplicationStatus.SUBMITTED,
        risk_score: scoreValue,
        reviewed_by: null,
        decision_at: null,
        rejection_reason: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    return { ...application, risk: riskResult };
  }

  async findById(id: string) {
    const application = await this.applicationDal.get({
      identifierOptions: { id } as never,
    });

    if (!application) {
      throw new NotFoundException();
    }

    return application;
  }

  async list(
    pagination?: PaginationValidator,
    filters?: {
      status?: ApplicationStatus;
      plan_tier?: string;
      date_from?: string;
      date_to?: string;
      reviewed_by?: string;
    },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {};
    if (filters?.status) findOptions.status = filters.status;
    if (filters?.plan_tier) findOptions.plan_tier = filters.plan_tier;
    if (filters?.reviewed_by) findOptions.reviewed_by = filters.reviewed_by;

    return this.applicationDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { submitted_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async transition(
    id: string,
    newStatus: ApplicationStatus,
    operatorId: string,
    reason?: string,
    ip?: string,
    ua?: string,
  ) {
    const application = await this.findById(id);

    if (
      !validateTransition(
        APPLICATION_TRANSITIONS,
        application.status,
        newStatus,
      )
    ) {
      throw new BadRequestException(
        `Cannot transition from ${application.status} to ${newStatus}`,
      );
    }

    const updatePayload: Record<string, unknown> = { status: newStatus };

    if (newStatus === ApplicationStatus.REJECTED) {
      updatePayload.rejection_reason = reason ?? null;
      updatePayload.decision_at = new Date();
    }

    if (newStatus === ApplicationStatus.APPROVED) {
      updatePayload.decision_at = new Date();
    }

    const updated = await this.applicationDal.update({
      identifierOptions: { id } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: `APPLICATION_${newStatus}`,
      target_type: 'signup_applications',
      target_id: id,
      before_val: { status: application.status },
      after_val: { status: newStatus, reason },
      ip_address: ip ?? '',
      user_agent: ua,
    });

    return updated;
  }

  async assign(
    id: string,
    reviewerId: string,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    await this.findById(id);

    const updated = await this.applicationDal.update({
      identifierOptions: { id } as never,
      updatePayload: { reviewed_by: reviewerId } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'APPLICATION_ASSIGNED',
      target_type: 'signup_applications',
      target_id: id,
      after_val: { reviewed_by: reviewerId },
      ip_address: ip,
      user_agent: ua,
    });

    return updated;
  }

  async addNote(
    appId: string,
    operatorId: string,
    noteText: string,
    ip: string,
    ua: string,
  ) {
    await this.findById(appId);

    const note = await this.noteDal.create({
      createPayload: {
        application_id: appId,
        operator_id: operatorId,
        note_text: noteText,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'APPLICATION_NOTE_ADDED',
      target_type: 'application_notes',
      target_id: note.id,
      ip_address: ip,
      user_agent: ua,
    });

    return note;
  }

  async getNotes(appId: string) {
    await this.findById(appId);

    return this.noteDal.find({
      findOptions: { application_id: appId } as never,
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async getDocuments(appId: string) {
    await this.findById(appId);

    return this.documentDal.find({
      findOptions: { application_id: appId } as never,
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async verifyDocument(
    docId: string,
    verified: boolean,
    operatorId: string,
    notes?: string,
    ip?: string,
    ua?: string,
  ) {
    const doc = await this.documentDal.get({
      identifierOptions: { id: docId } as never,
    });

    if (!doc) {
      throw new NotFoundException();
    }

    const updated = await this.documentDal.update({
      identifierOptions: { id: docId } as never,
      updatePayload: {
        verified,
        verified_by: operatorId,
        verified_at: new Date(),
        notes: notes ?? null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: verified ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
      target_type: 'application_documents',
      target_id: docId,
      ip_address: ip ?? '',
      user_agent: ua,
    });

    return updated;
  }

  async getSummaryCounts(): Promise<ApplicationSummaryCounts> {
    const counts = {} as ApplicationSummaryCounts;
    for (const status of Object.values(ApplicationStatus)) {
      const result = await this.applicationDal.find({
        findOptions: { status } as never,
        paginationPayload: { page: 1, limit: 1 },
        transactionOptions: { useTransaction: false },
      });
      counts[status] = result.paginationMeta.total ?? 0;
    }
    return counts;
  }
}
