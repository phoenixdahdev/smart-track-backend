import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClaimSubmissionDal } from '@dals/claim-submission.dal';
import { ClaimDal } from '@dals/claim.dal';
import { ClaimStatusHistoryDal } from '@dals/claim-status-history.dal';
import { EdiGeneratorService } from './edi-generator.service';
import { AuditLogService } from './audit-log.service';
import { type PaginationValidator } from '@utils/pagination-utils';
import { ClaimStatus, CLAIM_TRANSITIONS } from '@enums/claim-status.enum';
import { validateTransition } from '@utils/state-machine';

@Injectable()
export class ClaimSubmissionService {
  constructor(
    private readonly claimSubmissionDal: ClaimSubmissionDal,
    private readonly claimDal: ClaimDal,
    private readonly claimStatusHistoryDal: ClaimStatusHistoryDal,
    private readonly ediGeneratorService: EdiGeneratorService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async submitClaim(
    claimId: string,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const claim = await this.claimDal.get({
      identifierOptions: { id: claimId, org_id: orgId } as never,
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    if (!validateTransition(CLAIM_TRANSITIONS, claim.status, ClaimStatus.SUBMITTED)) {
      throw new BadRequestException(
        `Cannot submit a claim in ${claim.status} status`,
      );
    }

    const payload = await this.ediGeneratorService.buildClearinghousePayload(
      claimId,
      orgId,
    );

    const submission = await this.claimSubmissionDal.create({
      createPayload: {
        org_id: orgId,
        claim_id: claimId,
        submission_type: claim.claim_type,
        edi_content: JSON.stringify(payload),
        s3_key: null,
        clearinghouse_id: (payload.payer?.clearinghouse_routing as Record<string, string>)?.id ?? null,
        submitted_at: new Date(),
        response_received_at: null,
        response_status: null,
        response_details: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.claimDal.update({
      identifierOptions: { id: claimId, org_id: orgId } as never,
      updatePayload: {
        status: ClaimStatus.SUBMITTED,
        submitted_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.claimStatusHistoryDal.create({
      createPayload: {
        org_id: orgId,
        claim_id: claimId,
        from_status: claim.status,
        to_status: ClaimStatus.SUBMITTED,
        changed_by: userId,
        reason: null,
        details: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'CLAIM_SUBMISSION_CREATED',
      action_type: 'CREATE',
      table_name: 'claim_submissions',
      record_id: submission.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return submission;
  }

  async submitBatch(
    claimIds: string[],
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const submissions: Awaited<ReturnType<typeof this.submitClaim>>[] = [];
    for (const claimId of claimIds) {
      const submission = await this.submitClaim(
        claimId,
        orgId,
        userId,
        userRole,
        ip,
        userAgent,
      );
      submissions.push(submission);
    }
    return submissions;
  }

  async recordResponse(
    submissionId: string,
    responseStatus: string,
    responseDetails: Record<string, any>,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const submission = await this.claimSubmissionDal.get({
      identifierOptions: { id: submissionId, org_id: orgId } as never,
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    await this.claimSubmissionDal.update({
      identifierOptions: { id: submissionId, org_id: orgId } as never,
      updatePayload: {
        response_received_at: new Date(),
        response_status: responseStatus,
        response_details: responseDetails,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    // Map response status to claim status
    let claimStatus: ClaimStatus | null = null;
    if (responseStatus === 'ACCEPTED') {
      claimStatus = ClaimStatus.ACCEPTED_277;
    } else if (responseStatus === 'REJECTED') {
      claimStatus = ClaimStatus.REJECTED_277;
    }

    if (claimStatus) {
      const claim = await this.claimDal.get({
        identifierOptions: { id: submission.claim_id, org_id: orgId } as never,
      });

      if (claim && validateTransition(CLAIM_TRANSITIONS, claim.status, claimStatus)) {
        await this.claimDal.update({
          identifierOptions: { id: submission.claim_id, org_id: orgId } as never,
          updatePayload: { status: claimStatus } as never,
          transactionOptions: { useTransaction: false },
        });

        await this.claimStatusHistoryDal.create({
          createPayload: {
            org_id: orgId,
            claim_id: submission.claim_id,
            from_status: claim.status,
            to_status: claimStatus,
            changed_by: userId,
            reason: `277 response: ${responseStatus}`,
            details: responseDetails,
          } as never,
          transactionOptions: { useTransaction: false },
        });
      }
    }

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'CLAIM_SUBMISSION_RESPONSE_RECORDED',
      action_type: 'UPDATE',
      table_name: 'claim_submissions',
      record_id: submissionId,
      ip_address: ip,
      user_agent: userAgent,
    });

    return submission;
  }

  async findByClaimId(claimId: string, orgId: string) {
    return this.claimSubmissionDal.find({
      findOptions: { claim_id: claimId, org_id: orgId } as never,
      order: { submitted_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async list(orgId: string, pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.claimSubmissionDal.find({
      findOptions: { org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { submitted_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async findById(id: string, orgId: string) {
    const submission = await this.claimSubmissionDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!submission) {
      throw new NotFoundException();
    }

    return submission;
  }
}
