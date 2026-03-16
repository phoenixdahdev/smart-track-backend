import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentPostDal } from '@dals/payment-post.dal';
import { AdjustmentDal } from '@dals/adjustment.dal';
import { ClaimDal } from '@dals/claim.dal';
import { ClaimLineDal } from '@dals/claim-line.dal';
import { ClaimStatusHistoryDal } from '@dals/claim-status-history.dal';
import { ServiceAuthorizationService } from './service-authorization.service';
import { AuditLogService } from './audit-log.service';
import { AdjustmentType } from '@enums/adjustment-type.enum';
import { ClaimStatus, CLAIM_TRANSITIONS } from '@enums/claim-status.enum';
import { validateTransition } from '@utils/state-machine';
import { type PaginationValidator } from '@utils/pagination-utils';
import { type AdjustmentEntity } from '@entities/adjustment.entity';
import { type EraClaimPaymentAdjustment } from '@app-types/era.types';

const CAS_GROUP_MAP: Record<string, AdjustmentType> = {
  CO: AdjustmentType.CONTRACTUAL,
  PR: AdjustmentType.PATIENT_RESPONSIBILITY,
  OA: AdjustmentType.OTHER,
  PI: AdjustmentType.PAYER_REDUCTION,
};

@Injectable()
export class PaymentPostingService {
  constructor(
    private readonly paymentPostDal: PaymentPostDal,
    private readonly adjustmentDal: AdjustmentDal,
    private readonly claimDal: ClaimDal,
    private readonly claimLineDal: ClaimLineDal,
    private readonly claimStatusHistoryDal: ClaimStatusHistoryDal,
    private readonly serviceAuthorizationService: ServiceAuthorizationService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async postPayment(
    postId: string,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const post = await this.paymentPostDal.get({
      identifierOptions: { id: postId, org_id: orgId } as never,
    });
    if (!post) {
      throw new NotFoundException();
    }

    if (!post.claim_id) {
      throw new BadRequestException('Payment post must be matched to a claim before posting');
    }

    await this.applyPaymentToClaim(
      post.claim_id,
      orgId,
      userId,
    );

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'PAYMENT_POSTED',
      action_type: 'UPDATE',
      table_name: 'payment_posts',
      record_id: postId,
      ip_address: ip,
      user_agent: userAgent,
    });

    return post;
  }

  async applyPaymentToClaim(
    claimId: string,
    orgId: string,
    userId: string,
  ) {
    const claim = await this.claimDal.get({
      identifierOptions: { id: claimId, org_id: orgId } as never,
    });
    if (!claim) {
      throw new NotFoundException();
    }

    // Sum all payment posts for this claim
    const posts = await this.paymentPostDal.find({
      findOptions: { org_id: orgId, claim_id: claimId } as never,
      transactionOptions: { useTransaction: false },
    });

    let paidCents = 0;
    let patientRespCents = 0;
    for (const p of posts.payload) {
      paidCents += Number(p.paid_cents);
      patientRespCents += Number(p.patient_responsibility_cents);
    }

    // Sum contractual adjustments across claim lines
    const lines = await this.claimLineDal.find({
      findOptions: { org_id: orgId, claim_id: claimId } as never,
      transactionOptions: { useTransaction: false },
    });

    let contractualAdjCents = 0;
    for (const line of lines.payload) {
      const adjs = await this.adjustmentDal.find({
        findOptions: {
          org_id: orgId,
          claim_line_id: line.id,
          type: AdjustmentType.CONTRACTUAL,
        } as never,
        transactionOptions: { useTransaction: false },
      });
      for (const adj of adjs.payload) {
        contractualAdjCents += Number(adj.adjustment_amount_cents);
      }
    }

    const balanceCents =
      Number(claim.total_charge_cents) -
      paidCents -
      contractualAdjCents -
      patientRespCents;

    // Determine new status
    let newStatus: ClaimStatus | null = null;
    if (balanceCents === 0 && paidCents > 0) {
      newStatus = ClaimStatus.PAID;
    } else if (balanceCents > 0 && paidCents > 0) {
      newStatus = ClaimStatus.PARTIAL_PAYMENT;
    } else if (paidCents === 0) {
      // Check if there are denial adjustments
      const allAdjs = await this.adjustmentDal.find({
        findOptions: { org_id: orgId } as never,
        transactionOptions: { useTransaction: false },
      });
      const claimLineIds = new Set(lines.payload.map((l) => l.id));
      const hasDenialAdj = allAdjs.payload.some(
        (a) =>
          claimLineIds.has(a.claim_line_id) &&
          a.type !== AdjustmentType.CONTRACTUAL &&
          a.type !== AdjustmentType.PATIENT_RESPONSIBILITY,
      );
      newStatus = hasDenialAdj ? ClaimStatus.DENIED : ClaimStatus.ADJUSTED;
    }

    const updatePayload: Record<string, unknown> = {
      paid_amount_cents: paidCents,
      patient_responsibility_cents: patientRespCents,
      contractual_adj_cents: contractualAdjCents,
      balance_cents: balanceCents,
    };

    if (newStatus && validateTransition(CLAIM_TRANSITIONS, claim.status, newStatus)) {
      updatePayload.status = newStatus;
      if (newStatus === ClaimStatus.PAID) {
        updatePayload.paid_at = new Date();
      }
    }

    await this.claimDal.update({
      identifierOptions: { id: claimId, org_id: orgId } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    if (newStatus && validateTransition(CLAIM_TRANSITIONS, claim.status, newStatus)) {
      await this.claimStatusHistoryDal.create({
        createPayload: {
          org_id: orgId,
          claim_id: claimId,
          from_status: claim.status,
          to_status: newStatus,
          changed_by: userId,
          reason: 'Payment reconciliation',
          details: null,
        } as never,
        transactionOptions: { useTransaction: false },
      });
    }

    // Increment service authorization units if applicable
    if (claim.service_authorization_id && newStatus === ClaimStatus.PAID) {
      const totalUnits = lines.payload.reduce(
        (sum, l) => sum + Number(l.units_billed),
        0,
      );
      await this.serviceAuthorizationService.incrementUnitsUsed(
        claim.service_authorization_id,
        orgId,
        totalUnits,
      );
    }

    return claim;
  }

  async createAdjustments(
    postId: string,
    claimLineId: string,
    orgId: string,
    eraAdjs: EraClaimPaymentAdjustment[],
  ) {
    const created: AdjustmentEntity[] = [];
    for (const adj of eraAdjs) {
      const type =
        CAS_GROUP_MAP[adj.group_code] ?? AdjustmentType.OTHER;

      const record = await this.adjustmentDal.create({
        createPayload: {
          org_id: orgId,
          claim_line_id: claimLineId,
          payment_post_id: postId,
          type,
          reason_code: adj.reason_code,
          adjustment_amount_cents: adj.amount_cents,
        } as never,
        transactionOptions: { useTransaction: false },
      });
      created.push(record);
    }
    return created;
  }

  async listPaymentPosts(
    orgId: string,
    pagination?: PaginationValidator,
    filters?: { remittance_id?: string; claim_id?: string; unmatched_only?: string },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.remittance_id) findOptions.remittance_id = filters.remittance_id;
    if (filters?.claim_id) findOptions.claim_id = filters.claim_id;

    return this.paymentPostDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async findPaymentPostById(id: string, orgId: string) {
    const post = await this.paymentPostDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });
    if (!post) {
      throw new NotFoundException();
    }
    return post;
  }

  async listAdjustmentsByClaim(claimId: string, orgId: string) {
    const lines = await this.claimLineDal.find({
      findOptions: { org_id: orgId, claim_id: claimId } as never,
      transactionOptions: { useTransaction: false },
    });

    const allAdjs: AdjustmentEntity[] = [];
    for (const line of lines.payload) {
      const adjs = await this.adjustmentDal.find({
        findOptions: { org_id: orgId, claim_line_id: line.id } as never,
        transactionOptions: { useTransaction: false },
      });
      allAdjs.push(...adjs.payload);
    }

    return allAdjs;
  }

  async listAdjustmentsByPaymentPost(postId: string, orgId: string) {
    return this.adjustmentDal.find({
      findOptions: { org_id: orgId, payment_post_id: postId } as never,
      transactionOptions: { useTransaction: false },
    });
  }
}
