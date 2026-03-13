import { Injectable, NotFoundException } from '@nestjs/common';
import { ClaimDal } from '@dals/claim.dal';
import { ClaimLineDal } from '@dals/claim-line.dal';
import { PayerConfigDal } from '@dals/payer-config.dal';
import { OrganizationDal } from '@dals/organization.dal';
import { IndividualDal } from '@dals/individual.dal';

@Injectable()
export class EdiGeneratorService {
  constructor(
    private readonly claimDal: ClaimDal,
    private readonly claimLineDal: ClaimLineDal,
    private readonly payerConfigDal: PayerConfigDal,
    private readonly organizationDal: OrganizationDal,
    private readonly individualDal: IndividualDal,
  ) {}

  async buildClearinghousePayload(claimId: string, orgId: string) {
    const claim = await this.claimDal.get({
      identifierOptions: { id: claimId, org_id: orgId } as never,
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    const lines = await this.claimLineDal.find({
      findOptions: { claim_id: claimId, org_id: orgId } as never,
      order: { line_number: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });

    const payerConfig = await this.payerConfigDal.get({
      identifierOptions: { id: claim.payer_config_id, org_id: orgId } as never,
    });

    const individual = await this.individualDal.get({
      identifierOptions: { id: claim.individual_id, org_id: orgId } as never,
    });

    return {
      claim_id: claim.id,
      claim_type: claim.claim_type,
      billing_provider: {
        npi: claim.billing_provider_npi,
        ein: claim.billing_provider_ein,
        name: claim.billing_provider_name,
        address: claim.billing_provider_address,
      },
      subscriber: {
        subscriber_id: claim.subscriber_id,
        first_name: individual?.first_name ?? '',
        last_name: individual?.last_name ?? '',
      },
      payer: {
        payer_id: payerConfig?.payer_id_edi ?? '',
        payer_name: payerConfig?.payer_name ?? '',
        clearinghouse_routing: payerConfig?.clearinghouse_routing ?? {},
      },
      claim_info: {
        service_date_from: claim.service_date_from,
        service_date_through: claim.service_date_through,
        frequency_code: claim.frequency_code,
        place_of_service: claim.place_of_service,
        diagnosis_codes: claim.diagnosis_codes,
        total_charge_cents: claim.total_charge_cents,
      },
      lines: lines.payload.map((line) => ({
        line_number: line.line_number,
        procedure_code: line.procedure_code,
        modifiers: line.modifiers,
        service_date: line.service_date,
        units_billed: Number(line.units_billed),
        charge_cents: line.charge_cents,
        rendering_provider_npi: line.rendering_provider_npi,
        place_of_service: line.place_of_service,
        diagnosis_pointer: line.diagnosis_pointer,
      })),
    };
  }

  async buildBatchPayload(claimIds: string[], orgId: string) {
    const payloads: Awaited<ReturnType<typeof this.buildClearinghousePayload>>[] = [];
    for (const claimId of claimIds) {
      const payload = await this.buildClearinghousePayload(claimId, orgId);
      payloads.push(payload);
    }
    return {
      batch_id: `BATCH-${Date.now()}`,
      claim_count: payloads.length,
      claims: payloads,
    };
  }
}
