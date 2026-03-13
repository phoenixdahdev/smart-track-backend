import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClaimDal } from '@dals/claim.dal';
import { ClaimLineDal } from '@dals/claim-line.dal';
import { ClaimStatusHistoryDal } from '@dals/claim-status-history.dal';
import { ServiceRecordDal } from '@dals/service-record.dal';
import { IndividualPayerCoverageDal } from '@dals/individual-payer-coverage.dal';
import { ServiceCodeDal } from '@dals/service-code.dal';
import { ProgramDal } from '@dals/program.dal';
import { OrganizationDal } from '@dals/organization.dal';
import { IndividualDal } from '@dals/individual.dal';
import { RateTableService } from './rate-table.service';
import { ServiceAuthorizationService } from './service-authorization.service';
import { AuditLogService } from './audit-log.service';
import { type ServiceRecordEntity } from '@entities/service-record.entity';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import { ClaimStatus } from '@enums/claim-status.enum';
import { ClaimType } from '@enums/claim-type.enum';

@Injectable()
export class ClaimMappingService {
  constructor(
    private readonly claimDal: ClaimDal,
    private readonly claimLineDal: ClaimLineDal,
    private readonly claimStatusHistoryDal: ClaimStatusHistoryDal,
    private readonly serviceRecordDal: ServiceRecordDal,
    private readonly coverageDal: IndividualPayerCoverageDal,
    private readonly serviceCodeDal: ServiceCodeDal,
    private readonly programDal: ProgramDal,
    private readonly organizationDal: OrganizationDal,
    private readonly individualDal: IndividualDal,
    private readonly rateTableService: RateTableService,
    private readonly serviceAuthorizationService: ServiceAuthorizationService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async mapSingleRecord(
    serviceRecordId: string,
    orgId: string,
    userId: string,
  ) {
    return this.mapServiceRecordsToClaim([serviceRecordId], orgId, userId);
  }

  async mapServiceRecordsToClaim(
    serviceRecordIds: string[],
    orgId: string,
    userId: string,
  ) {
    if (serviceRecordIds.length === 0) {
      throw new BadRequestException('At least one service record ID is required');
    }

    // Load all service records
    const records: ServiceRecordEntity[] = [];
    for (const id of serviceRecordIds) {
      const record = await this.serviceRecordDal.get({
        identifierOptions: { id, org_id: orgId } as never,
      });

      if (!record) {
        throw new NotFoundException(`Service record ${id} not found`);
      }

      if (record.status !== ServiceRecordStatus.APPROVED) {
        throw new BadRequestException(
          `Service record ${id} is not in APPROVED status`,
        );
      }

      records.push(record);
    }

    // All records must share the same individual
    const individualIds = new Set(records.map((r) => r.individual_id));
    if (individualIds.size > 1) {
      throw new BadRequestException(
        'All service records must be for the same individual',
      );
    }

    const individualId = records[0].individual_id;
    const serviceDate = records[0].service_date;

    // 1. Identify payer
    const coverage = await this.resolvePayer(individualId, serviceDate, orgId);

    // 2. Get org info for billing provider
    const org = await this.organizationDal.get({
      identifierOptions: { id: orgId } as never,
    });

    if (!org) {
      throw new BadRequestException('Organization not found');
    }

    // 3. Resolve claim type
    const claimType = await this.resolveClaimType(records[0].program_id, coverage.payer_config_id, orgId);

    // 4. Check for service authorization
    const serviceCodeId = records[0].service_code_id;
    let authId: string | null = null;

    if (serviceCodeId) {
      const auth = await this.serviceAuthorizationService.findAuthForBilling(
        individualId,
        serviceCodeId,
        serviceDate,
        orgId,
      );
      if (auth) {
        authId = auth.id;
      }
    }

    // 5. Build claim record
    const claim = await this.claimDal.create({
      createPayload: {
        org_id: orgId,
        service_record_id: records[0].id,
        individual_id: individualId,
        payer_config_id: coverage.payer_config_id,
        claim_type: claimType,
        subscriber_id: coverage.subscriber_id,
        billing_provider_npi: org.npi,
        billing_provider_ein: org.ein,
        billing_provider_name: org.legal_name,
        billing_provider_address: {
          line1: org.address_line1,
          line2: org.address_line2,
          city: org.city,
          state: org.state,
          zip: org.zip,
        },
        service_date_from: serviceDate,
        service_date_through: records[records.length - 1].service_date,
        frequency_code: '1',
        place_of_service: '12',
        diagnosis_codes: [],
        total_charge_cents: 0,
        status: ClaimStatus.DRAFT,
        service_authorization_id: authId,
        created_by: userId,
        validation_errors: null,
        last_validated_at: null,
        paid_amount_cents: 0,
        patient_responsibility_cents: 0,
        contractual_adj_cents: 0,
        balance_cents: 0,
        payer_claim_control_number: null,
        denial_reason_codes: [],
        original_claim_id: null,
        submitted_at: null,
        paid_at: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    // 6. Build claim lines and calculate total
    let totalChargeCents = 0;
    let lineNumber = 1;

    for (const record of records) {
      const rate = await this.resolveRate(
        coverage.payer_config_id,
        record.service_code_id,
        record.service_date,
        orgId,
      );

      const rateCents = rate?.rate_cents ?? 0;
      const units = Number(record.units_delivered);
      const chargeCents = Math.round(rateCents * units);
      totalChargeCents += chargeCents;

      let procedureCode = '';
      if (record.service_code_id) {
        const sc = await this.serviceCodeDal.get({
          identifierOptions: { id: record.service_code_id, org_id: orgId } as never,
        });
        if (sc) procedureCode = sc.code;
      }

      await this.claimLineDal.create({
        createPayload: {
          org_id: orgId,
          claim_id: claim.id,
          service_code_id: record.service_code_id ?? null,
          procedure_code: procedureCode,
          modifiers: [],
          service_date: record.service_date,
          units_billed: units,
          charge_cents: chargeCents,
          rendering_provider_npi: null,
          place_of_service: '12',
          diagnosis_pointer: [],
          line_number: lineNumber,
        } as never,
        transactionOptions: { useTransaction: false },
      });

      lineNumber++;
    }

    // Update total charge
    await this.claimDal.update({
      identifierOptions: { id: claim.id, org_id: orgId } as never,
      updatePayload: {
        total_charge_cents: totalChargeCents,
        balance_cents: totalChargeCents,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    // 7. Record status history
    await this.recordStatusHistory(claim.id, null, ClaimStatus.DRAFT, userId, orgId);

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: 'BILLING_SPECIALIST',
      action: 'CLAIM_GENERATED',
      action_type: 'CREATE',
      table_name: 'claims',
      record_id: claim.id,
      ip_address: '',
      user_agent: '',
    });

    return { ...claim, total_charge_cents: totalChargeCents };
  }

  private async resolvePayer(
    individualId: string,
    serviceDate: string,
    orgId: string,
  ) {
    const coverages = await this.coverageDal.find({
      findOptions: {
        org_id: orgId,
        individual_id: individualId,
        active: true,
      } as never,
      order: { priority: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const activeCoverage = coverages.payload.find((cov) => {
      const start = cov.coverage_start;
      const end = cov.coverage_end;
      return serviceDate >= start && (end == null || serviceDate <= end);
    });

    if (!activeCoverage) {
      throw new BadRequestException(
        'No active payer coverage found for the service date',
      );
    }

    return activeCoverage;
  }

  private async resolveRate(
    payerConfigId: string,
    serviceCodeId: string | null,
    serviceDate: string,
    orgId: string,
  ) {
    if (!serviceCodeId) return null;

    return this.rateTableService.findRate(
      payerConfigId,
      serviceCodeId,
      serviceDate,
      orgId,
    );
  }

  private async resolveClaimType(
    programId: string | null,
    payerConfigId: string,
    orgId: string,
  ): Promise<ClaimType> {
    if (programId) {
      const program = await this.programDal.get({
        identifierOptions: { id: programId, org_id: orgId } as never,
      });

      if (program?.billing_type === 'INSTITUTIONAL') {
        return ClaimType.INSTITUTIONAL_837I;
      }
    }

    return ClaimType.PROFESSIONAL_837P;
  }

  private async recordStatusHistory(
    claimId: string,
    fromStatus: ClaimStatus | null,
    toStatus: ClaimStatus,
    userId: string,
    orgId: string,
    reason?: string,
  ) {
    await this.claimStatusHistoryDal.create({
      createPayload: {
        org_id: orgId,
        claim_id: claimId,
        from_status: fromStatus,
        to_status: toStatus,
        changed_by: userId,
        reason: reason ?? null,
        details: null,
      } as never,
      transactionOptions: { useTransaction: false },
    });
  }
}
