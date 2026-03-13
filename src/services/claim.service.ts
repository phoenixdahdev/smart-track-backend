import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClaimDal } from '@dals/claim.dal';
import { ClaimLineDal } from '@dals/claim-line.dal';
import { ClaimStatusHistoryDal } from '@dals/claim-status-history.dal';
import { ClaimValidationService } from './claim-validation.service';
import { ServiceAuthorizationService } from './service-authorization.service';
import { AuditLogService } from './audit-log.service';
import { type UpdateClaimDto } from '@dtos/update-claim.dto';
import { type PaginationValidator } from '@utils/pagination-utils';
import { ClaimStatus, CLAIM_TRANSITIONS } from '@enums/claim-status.enum';
import { validateTransition } from '@utils/state-machine';

@Injectable()
export class ClaimService {
  constructor(
    private readonly claimDal: ClaimDal,
    private readonly claimLineDal: ClaimLineDal,
    private readonly claimStatusHistoryDal: ClaimStatusHistoryDal,
    private readonly claimValidationService: ClaimValidationService,
    private readonly serviceAuthorizationService: ServiceAuthorizationService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findById(id: string, orgId: string) {
    const claim = await this.claimDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!claim) {
      throw new NotFoundException();
    }

    return claim;
  }

  async list(
    orgId: string,
    pagination?: PaginationValidator,
    filters?: { status?: ClaimStatus; individual_id?: string },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.status) findOptions.status = filters.status;
    if (filters?.individual_id) findOptions.individual_id = filters.individual_id;

    return this.claimDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async updateDraft(
    id: string,
    orgId: string,
    dto: UpdateClaimDto,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const claim = await this.findById(id, orgId);

    if (claim.status !== ClaimStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT claims can be edited');
    }

    const updated = await this.claimDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'CLAIM_UPDATED',
      action_type: 'UPDATE',
      table_name: 'claims',
      record_id: id,
      before_val: claim as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async transitionStatus(
    id: string,
    orgId: string,
    newStatus: ClaimStatus,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
    reason?: string,
  ) {
    const claim = await this.findById(id, orgId);

    if (!validateTransition(CLAIM_TRANSITIONS, claim.status, newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${claim.status} to ${newStatus}`,
      );
    }

    // Side effects based on transition
    if (claim.status === ClaimStatus.DRAFT && newStatus === ClaimStatus.SUBMITTED) {
      const validation = await this.claimValidationService.validateAndStore(id, orgId);
      if (!validation.valid) {
        throw new BadRequestException('Claim has blocking validation errors');
      }
    }

    const updatePayload: Record<string, unknown> = { status: newStatus };

    if (newStatus === ClaimStatus.SUBMITTED) {
      updatePayload.submitted_at = new Date();
    }

    if (newStatus === ClaimStatus.PAID) {
      updatePayload.paid_at = new Date();
    }

    const updated = await this.claimDal.update({
      identifierOptions: { id, org_id: orgId } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.claimStatusHistoryDal.create({
      createPayload: {
        org_id: orgId,
        claim_id: id,
        from_status: claim.status,
        to_status: newStatus,
        changed_by: userId,
        reason: reason ?? null,
        details: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: `CLAIM_${newStatus}`,
      action_type: 'UPDATE',
      table_name: 'claims',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async voidClaim(
    id: string,
    orgId: string,
    userId: string,
    userRole: string,
    reason: string,
    ip: string,
    userAgent: string,
  ) {
    return this.transitionStatus(
      id,
      orgId,
      ClaimStatus.VOID,
      userId,
      userRole,
      ip,
      userAgent,
      reason,
    );
  }

  async getDeniedClaims(orgId: string, pagination?: PaginationValidator) {
    return this.list(orgId, pagination, { status: ClaimStatus.DENIED });
  }

  async createReplacementClaim(
    originalClaimId: string,
    orgId: string,
    userId: string,
  ) {
    const original = await this.findById(originalClaimId, orgId);

    const replacement = await this.claimDal.create({
      createPayload: {
        org_id: orgId,
        service_record_id: original.service_record_id,
        individual_id: original.individual_id,
        payer_config_id: original.payer_config_id,
        claim_type: original.claim_type,
        subscriber_id: original.subscriber_id,
        billing_provider_npi: original.billing_provider_npi,
        billing_provider_ein: original.billing_provider_ein,
        billing_provider_name: original.billing_provider_name,
        billing_provider_address: original.billing_provider_address,
        service_date_from: original.service_date_from,
        service_date_through: original.service_date_through,
        frequency_code: '7',
        place_of_service: original.place_of_service,
        diagnosis_codes: original.diagnosis_codes,
        total_charge_cents: original.total_charge_cents,
        status: ClaimStatus.DRAFT,
        original_claim_id: originalClaimId,
        service_authorization_id: original.service_authorization_id,
        created_by: userId,
        validation_errors: null,
        last_validated_at: null,
        paid_amount_cents: 0,
        patient_responsibility_cents: 0,
        contractual_adj_cents: 0,
        balance_cents: original.total_charge_cents,
        payer_claim_control_number: null,
        denial_reason_codes: [],
        submitted_at: null,
        paid_at: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    // Copy claim lines
    const originalLines = await this.claimLineDal.find({
      findOptions: { claim_id: originalClaimId, org_id: orgId } as never,
      transactionOptions: { useTransaction: false },
    });

    for (const line of originalLines.payload) {
      await this.claimLineDal.create({
        createPayload: {
          org_id: orgId,
          claim_id: replacement.id,
          service_code_id: line.service_code_id,
          procedure_code: line.procedure_code,
          modifiers: line.modifiers,
          service_date: line.service_date,
          units_billed: line.units_billed,
          charge_cents: line.charge_cents,
          rendering_provider_npi: line.rendering_provider_npi,
          place_of_service: line.place_of_service,
          diagnosis_pointer: line.diagnosis_pointer,
          line_number: line.line_number,
        } as never,
        transactionOptions: { useTransaction: false },
      });
    }

    await this.claimStatusHistoryDal.create({
      createPayload: {
        org_id: orgId,
        claim_id: replacement.id,
        from_status: null,
        to_status: ClaimStatus.DRAFT,
        changed_by: userId,
        reason: `Replacement for claim ${originalClaimId}`,
        details: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    return replacement;
  }

  async getStatusHistory(claimId: string, orgId: string) {
    await this.findById(claimId, orgId);

    return this.claimStatusHistoryDal.find({
      findOptions: { claim_id: claimId, org_id: orgId } as never,
      order: { created_at: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }
}
