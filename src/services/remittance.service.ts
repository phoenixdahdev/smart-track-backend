import { Injectable, NotFoundException } from '@nestjs/common';
import { RemittanceDal } from '@dals/remittance.dal';
import { PaymentPostDal } from '@dals/payment-post.dal';
import { ClaimLineDal } from '@dals/claim-line.dal';
import { PaymentMatchingService } from './payment-matching.service';
import { PaymentPostingService } from './payment-posting.service';
import { AuditLogService } from './audit-log.service';
import { RemittanceStatus } from '@enums/remittance-status.enum';
import { type IngestEraDto } from '@dtos/ingest-era.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class RemittanceService {
  constructor(
    private readonly remittanceDal: RemittanceDal,
    private readonly paymentPostDal: PaymentPostDal,
    private readonly claimLineDal: ClaimLineDal,
    private readonly paymentMatchingService: PaymentMatchingService,
    private readonly paymentPostingService: PaymentPostingService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async ingestEra(
    dto: IngestEraDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    // 1. Create remittance
    const remittance = await this.remittanceDal.create({
      createPayload: {
        org_id: orgId,
        payer_config_id: dto.payer_config_id,
        payment_date: dto.payment_date,
        eft_trace_number: dto.eft_trace_number,
        eft_total_cents: dto.eft_total_cents,
        interchange_control_num: dto.interchange_control_num ?? null,
        status: RemittanceStatus.RECEIVED,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    let matchedCount = 0;

    // 2. Process each claim payment
    for (const cp of dto.claim_payments) {
      // Create payment post (unmatched initially)
      const post = await this.paymentPostDal.create({
        createPayload: {
          org_id: orgId,
          remittance_id: remittance.id,
          claim_id: null,
          claim_line_id: null,
          status_code: cp.status_code ?? null,
          billed_cents: cp.billed_cents,
          paid_cents: cp.paid_cents,
          patient_responsibility_cents: cp.patient_responsibility_cents ?? 0,
          payer_claim_control_number: cp.payer_claim_control_number ?? null,
          matching_confidence: null,
          matching_method: null,
        } as never,
        transactionOptions: { useTransaction: false },
      });

      // Run matching cascade
      const match = await this.paymentMatchingService.matchPaymentPost(cp, orgId);

      if (match) {
        matchedCount++;

        // Update post with match info
        await this.paymentPostDal.update({
          identifierOptions: { id: post.id, org_id: orgId } as never,
          updatePayload: {
            claim_id: match.claim_id,
            matching_method: match.method,
            matching_confidence: match.confidence,
          } as never,
          transactionOptions: { useTransaction: false },
        });

        // Create adjustments if present
        if (cp.adjustments && cp.adjustments.length > 0) {
          // Find first claim line for this claim to attach adjustments
          const lines = await this.claimLineDal.find({
            findOptions: { org_id: orgId, claim_id: match.claim_id } as never,
            transactionOptions: { useTransaction: false },
          });
          const lineId = lines.payload[0]?.id;
          if (lineId) {
            await this.paymentPostingService.createAdjustments(
              post.id,
              lineId,
              orgId,
              cp.adjustments,
            );
          }
        }

        // Apply payment to claim
        await this.paymentPostingService.applyPaymentToClaim(
          match.claim_id,
          orgId,
          userId,
        );
      }
    }

    // 3. Recalculate remittance status
    const totalPayments = dto.claim_payments.length;
    let status: RemittanceStatus;
    if (totalPayments === 0) {
      status = RemittanceStatus.RECEIVED;
    } else if (matchedCount === totalPayments) {
      status = RemittanceStatus.FULLY_POSTED;
    } else if (matchedCount > 0) {
      status = RemittanceStatus.PARTIAL;
    } else {
      status = RemittanceStatus.UNMATCHED;
    }

    await this.remittanceDal.update({
      identifierOptions: { id: remittance.id, org_id: orgId } as never,
      updatePayload: { status } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'ERA_INGESTED',
      action_type: 'CREATE',
      table_name: 'remittances',
      record_id: remittance.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return { ...remittance, status, matched_count: matchedCount, total_count: totalPayments };
  }

  async findById(id: string, orgId: string) {
    const remittance = await this.remittanceDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });
    if (!remittance) {
      throw new NotFoundException();
    }
    return remittance;
  }

  async list(
    orgId: string,
    pagination?: PaginationValidator,
    filters?: {
      status?: RemittanceStatus;
      date_from?: string;
      date_to?: string;
      payer_config_id?: string;
    },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.status) findOptions.status = filters.status;
    if (filters?.payer_config_id) findOptions.payer_config_id = filters.payer_config_id;

    return this.remittanceDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { payment_date: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async getPaymentPosts(remittanceId: string, orgId: string) {
    await this.findById(remittanceId, orgId);

    return this.paymentPostDal.find({
      findOptions: { org_id: orgId, remittance_id: remittanceId } as never,
      order: { created_at: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async recalculateStatus(remittanceId: string, orgId: string) {
    await this.findById(remittanceId, orgId);

    const posts = await this.paymentPostDal.find({
      findOptions: { org_id: orgId, remittance_id: remittanceId } as never,
      transactionOptions: { useTransaction: false },
    });

    const total = posts.payload.length;
    const matched = posts.payload.filter((p) => p.claim_id !== null).length;

    let status: RemittanceStatus;
    if (total === 0) {
      status = RemittanceStatus.RECEIVED;
    } else if (matched === total) {
      status = RemittanceStatus.FULLY_POSTED;
    } else if (matched > 0) {
      status = RemittanceStatus.PARTIAL;
    } else {
      status = RemittanceStatus.UNMATCHED;
    }

    await this.remittanceDal.update({
      identifierOptions: { id: remittanceId, org_id: orgId } as never,
      updatePayload: { status } as never,
      transactionOptions: { useTransaction: false },
    });

    return { remittance_id: remittanceId, status, total, matched };
  }
}
