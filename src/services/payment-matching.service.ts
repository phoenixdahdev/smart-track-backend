import { Injectable, NotFoundException } from '@nestjs/common';
import { ClaimDal } from '@dals/claim.dal';
import { PaymentPostDal } from '@dals/payment-post.dal';
import { IndividualPayerCoverageDal } from '@dals/individual-payer-coverage.dal';
import { AuditLogService } from './audit-log.service';
import { MatchingMethod } from '@enums/matching-method.enum';
import { type MatchResult, type EraClaimPayment } from '@app-types/era.types';
import { type PaginationValidator } from '@utils/pagination-utils';
import { IsNull } from 'typeorm';

@Injectable()
export class PaymentMatchingService {
  constructor(
    private readonly claimDal: ClaimDal,
    private readonly paymentPostDal: PaymentPostDal,
    private readonly individualPayerCoverageDal: IndividualPayerCoverageDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async matchPaymentPost(
    eraPayment: EraClaimPayment,
    orgId: string,
  ): Promise<MatchResult | null> {
    // Priority 1: Direct claim_id match
    if (eraPayment.claim_id) {
      const claim = await this.claimDal.get({
        identifierOptions: { id: eraPayment.claim_id, org_id: orgId } as never,
      });
      if (claim) {
        return {
          claim_id: claim.id,
          method: MatchingMethod.CLAIM_ID,
          confidence: 1.0,
        };
      }
    }

    // Priority 2: Payer claim control number
    if (eraPayment.payer_claim_control_number) {
      const claims = await this.claimDal.find({
        findOptions: {
          org_id: orgId,
          payer_claim_control_number: eraPayment.payer_claim_control_number,
        } as never,
        transactionOptions: { useTransaction: false },
      });
      if (claims.payload.length === 1) {
        return {
          claim_id: claims.payload[0].id,
          method: MatchingMethod.PAYER_CONTROL_NUM,
          confidence: 0.95,
        };
      }
    }

    // Priority 3: Service date + subscriber_id from coverage
    if (
      eraPayment.subscriber_id &&
      eraPayment.service_date_from &&
      eraPayment.service_date_through
    ) {
      const coverages = await this.individualPayerCoverageDal.find({
        findOptions: {
          org_id: orgId,
          subscriber_id: eraPayment.subscriber_id,
        } as never,
        transactionOptions: { useTransaction: false },
      });

      for (const cov of coverages.payload) {
        const claims = await this.claimDal.find({
          findOptions: {
            org_id: orgId,
            individual_id: cov.individual_id,
            service_date_from: eraPayment.service_date_from,
            service_date_through: eraPayment.service_date_through,
          } as never,
          transactionOptions: { useTransaction: false },
        });
        if (claims.payload.length === 1) {
          return {
            claim_id: claims.payload[0].id,
            method: MatchingMethod.SERVICE_DATE_MEMBER,
            confidence: 0.8,
          };
        }
      }
    }

    return null;
  }

  async manualMatch(
    postId: string,
    claimId: string,
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

    const claim = await this.claimDal.get({
      identifierOptions: { id: claimId, org_id: orgId } as never,
    });
    if (!claim) {
      throw new NotFoundException();
    }

    const updated = await this.paymentPostDal.update({
      identifierOptions: { id: postId, org_id: orgId } as never,
      updatePayload: {
        claim_id: claimId,
        matching_method: MatchingMethod.MANUAL,
        matching_confidence: 1.0,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'PAYMENT_POST_MANUAL_MATCH',
      action_type: 'UPDATE',
      table_name: 'payment_posts',
      record_id: postId,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async unmatch(
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

    const updated = await this.paymentPostDal.update({
      identifierOptions: { id: postId, org_id: orgId } as never,
      updatePayload: {
        claim_id: null,
        matching_method: null,
        matching_confidence: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'PAYMENT_POST_UNMATCHED',
      action_type: 'UPDATE',
      table_name: 'payment_posts',
      record_id: postId,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async listUnmatched(orgId: string, pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.paymentPostDal.find({
      findOptions: { org_id: orgId, claim_id: IsNull() } as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }
}
