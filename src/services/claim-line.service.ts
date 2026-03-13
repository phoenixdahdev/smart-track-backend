import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClaimLineDal } from '@dals/claim-line.dal';
import { ClaimDal } from '@dals/claim.dal';
import { ServiceCodeDal } from '@dals/service-code.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateClaimLineDto } from '@dtos/create-claim-line.dto';
import { type UpdateClaimLineDto } from '@dtos/update-claim-line.dto';
import { ClaimStatus } from '@enums/claim-status.enum';

@Injectable()
export class ClaimLineService {
  constructor(
    private readonly claimLineDal: ClaimLineDal,
    private readonly claimDal: ClaimDal,
    private readonly serviceCodeDal: ServiceCodeDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findByClaimId(claimId: string, orgId: string) {
    return this.claimLineDal.find({
      findOptions: { claim_id: claimId, org_id: orgId } as never,
      order: { line_number: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async addLine(
    claimId: string,
    dto: CreateClaimLineDto,
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

    if (claim.status !== ClaimStatus.DRAFT) {
      throw new BadRequestException('Can only add lines to DRAFT claims');
    }

    // Auto line number
    const existingLines = await this.findByClaimId(claimId, orgId);
    const nextLineNumber = existingLines.payload.length + 1;

    const line = await this.claimLineDal.create({
      createPayload: {
        org_id: orgId,
        claim_id: claimId,
        service_code_id: dto.service_code_id,
        procedure_code: dto.procedure_code,
        modifiers: dto.modifiers ?? [],
        service_date: dto.service_date,
        units_billed: dto.units_billed,
        charge_cents: dto.charge_cents,
        rendering_provider_npi: dto.rendering_provider_npi ?? null,
        place_of_service: dto.place_of_service ?? '12',
        diagnosis_pointer: dto.diagnosis_pointer ?? [],
        line_number: nextLineNumber,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.recalculateClaimTotal(claimId, orgId);

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'CLAIM_LINE_ADDED',
      action_type: 'CREATE',
      table_name: 'claim_lines',
      record_id: line.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return line;
  }

  async updateLine(
    claimId: string,
    lineId: string,
    dto: UpdateClaimLineDto,
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

    if (claim.status !== ClaimStatus.DRAFT) {
      throw new BadRequestException('Can only update lines on DRAFT claims');
    }

    const existing = await this.claimLineDal.get({
      identifierOptions: { id: lineId, claim_id: claimId, org_id: orgId } as never,
    });

    if (!existing) {
      throw new NotFoundException('Claim line not found');
    }

    const updated = await this.claimLineDal.update({
      identifierOptions: { id: lineId, org_id: orgId } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.recalculateClaimTotal(claimId, orgId);

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'CLAIM_LINE_UPDATED',
      action_type: 'UPDATE',
      table_name: 'claim_lines',
      record_id: lineId,
      before_val: existing as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async removeLine(
    claimId: string,
    lineId: string,
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

    if (claim.status !== ClaimStatus.DRAFT) {
      throw new BadRequestException('Can only remove lines from DRAFT claims');
    }

    const existing = await this.claimLineDal.get({
      identifierOptions: { id: lineId, claim_id: claimId, org_id: orgId } as never,
    });

    if (!existing) {
      throw new NotFoundException('Claim line not found');
    }

    await this.claimLineDal.delete({
      identifierOptions: { id: lineId } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.recalculateClaimTotal(claimId, orgId);

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'CLAIM_LINE_REMOVED',
      action_type: 'DELETE',
      table_name: 'claim_lines',
      record_id: lineId,
      ip_address: ip,
      user_agent: userAgent,
    });
  }

  async recalculateClaimTotal(claimId: string, orgId: string) {
    const lines = await this.findByClaimId(claimId, orgId);

    const totalChargeCents = lines.payload.reduce(
      (sum, line) => sum + line.charge_cents,
      0,
    );

    await this.claimDal.update({
      identifierOptions: { id: claimId, org_id: orgId } as never,
      updatePayload: {
        total_charge_cents: totalChargeCents,
        balance_cents: totalChargeCents,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    return totalChargeCents;
  }
}
