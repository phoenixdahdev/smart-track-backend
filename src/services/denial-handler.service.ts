import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ClaimDal } from '@dals/claim.dal';
import { ClaimStatusHistoryDal } from '@dals/claim-status-history.dal';
import { ClaimMappingService } from './claim-mapping.service';
import { ServiceAuthorizationService } from './service-authorization.service';
import { AuditLogService } from './audit-log.service';
import { ClaimStatus, CLAIM_TRANSITIONS } from '@enums/claim-status.enum';
import { validateTransition } from '@utils/state-machine';

const DENIAL_CATEGORIES: Record<string, { category: string; suggestion: string }> = {
  'CO-4': { category: 'CODING', suggestion: 'Review procedure code and modifiers' },
  'CO-11': { category: 'DIAGNOSIS', suggestion: 'Check diagnosis code linkage' },
  'CO-16': { category: 'INFORMATION', suggestion: 'Missing or invalid claim information' },
  'CO-18': { category: 'DUPLICATE', suggestion: 'Duplicate claim — check for prior submission' },
  'CO-50': { category: 'NON_COVERED', suggestion: 'Service not covered by plan' },
  'CO-97': { category: 'AUTHORIZATION', suggestion: 'Authorization required — check auth status' },
  'CO-170': { category: 'PRECERTIFICATION', suggestion: 'Precertification or authorization required' },
};

@Injectable()
export class DenialHandlerService {
  constructor(
    private readonly claimDal: ClaimDal,
    private readonly claimStatusHistoryDal: ClaimStatusHistoryDal,
    private readonly claimMappingService: ClaimMappingService,
    private readonly serviceAuthorizationService: ServiceAuthorizationService,
    private readonly auditLogService: AuditLogService,
  ) {}

  handleDenial(denialCode: string) {
    const info = DENIAL_CATEGORIES[denialCode];
    return {
      denial_code: denialCode,
      category: info?.category ?? 'UNKNOWN',
      suggestion: info?.suggestion ?? 'Review claim details and contact payer',
    };
  }

  async appeal(
    claimId: string,
    orgId: string,
    userId: string,
    userRole: string,
    reason: string,
    ip: string,
    userAgent: string,
  ) {
    const claim = await this.claimDal.get({
      identifierOptions: { id: claimId, org_id: orgId } as never,
    });

    if (!claim) {
      throw new BadRequestException('Claim not found');
    }

    if (!validateTransition(CLAIM_TRANSITIONS, claim.status, ClaimStatus.APPEALED)) {
      throw new BadRequestException(
        `Cannot appeal a claim in ${claim.status} status`,
      );
    }

    const updated = await this.claimDal.update({
      identifierOptions: { id: claimId, org_id: orgId } as never,
      updatePayload: { status: ClaimStatus.APPEALED } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.claimStatusHistoryDal.create({
      createPayload: {
        org_id: orgId,
        claim_id: claimId,
        from_status: claim.status,
        to_status: ClaimStatus.APPEALED,
        changed_by: userId,
        reason,
        details: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'CLAIM_APPEALED',
      action_type: 'UPDATE',
      table_name: 'claims',
      record_id: claimId,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async writeOff(
    claimId: string,
    orgId: string,
    userId: string,
    userRole: string,
    reason: string,
    ip: string,
    userAgent: string,
  ) {
    const claim = await this.claimDal.get({
      identifierOptions: { id: claimId, org_id: orgId } as never,
    });

    if (!claim) {
      throw new BadRequestException('Claim not found');
    }

    if (!validateTransition(CLAIM_TRANSITIONS, claim.status, ClaimStatus.VOID)) {
      throw new BadRequestException(
        `Cannot write off a claim in ${claim.status} status`,
      );
    }

    const updated = await this.claimDal.update({
      identifierOptions: { id: claimId, org_id: orgId } as never,
      updatePayload: {
        status: ClaimStatus.VOID,
        balance_cents: 0,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.claimStatusHistoryDal.create({
      createPayload: {
        org_id: orgId,
        claim_id: claimId,
        from_status: claim.status,
        to_status: ClaimStatus.VOID,
        changed_by: userId,
        reason: `Write-off: ${reason}`,
        details: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'CLAIM_WRITTEN_OFF',
      action_type: 'UPDATE',
      table_name: 'claims',
      record_id: claimId,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async correctAndResubmit(
    claimId: string,
    orgId: string,
    userId: string,
  ) {
    const claim = await this.claimDal.get({
      identifierOptions: { id: claimId, org_id: orgId } as never,
    });

    if (!claim) {
      throw new BadRequestException('Claim not found');
    }

    // Void original, create replacement
    await this.claimDal.update({
      identifierOptions: { id: claimId, org_id: orgId } as never,
      updatePayload: { status: ClaimStatus.VOID } as never,
      transactionOptions: { useTransaction: false },
    });

    return this.claimMappingService.mapSingleRecord(
      claim.service_record_id,
      orgId,
      userId,
    );
  }
}
