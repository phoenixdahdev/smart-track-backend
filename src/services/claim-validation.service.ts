import { Injectable } from '@nestjs/common';
import { ClaimDal } from '@dals/claim.dal';
import { ClaimLineDal } from '@dals/claim-line.dal';
import { ServiceCodeDal } from '@dals/service-code.dal';
import { ServiceAuthorizationDal } from '@dals/service-authorization.dal';
import { PayerConfigDal } from '@dals/payer-config.dal';
import { OrganizationDal } from '@dals/organization.dal';
import {
  type ClaimValidationResult,
  type ValidationError,
  type ValidationWarning,
} from '@app-types/claim-validation.types';
import { ClaimStatus } from '@enums/claim-status.enum';

@Injectable()
export class ClaimValidationService {
  constructor(
    private readonly claimDal: ClaimDal,
    private readonly claimLineDal: ClaimLineDal,
    private readonly serviceCodeDal: ServiceCodeDal,
    private readonly serviceAuthorizationDal: ServiceAuthorizationDal,
    private readonly payerConfigDal: PayerConfigDal,
    private readonly organizationDal: OrganizationDal,
  ) {}

  async validateClaim(
    claimId: string,
    orgId: string,
  ): Promise<ClaimValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const claim = await this.claimDal.get({
      identifierOptions: { id: claimId, org_id: orgId } as never,
    });

    if (!claim) {
      errors.push({
        code: 'CLAIM_NOT_FOUND',
        message: 'Claim not found',
        blocking: true,
      });
      return { valid: false, errors, warnings };
    }

    // 1. NPI_MISSING
    if (!claim.billing_provider_npi) {
      errors.push({
        code: 'NPI_MISSING',
        field: 'billing_provider_npi',
        message: 'Billing provider NPI is required',
        blocking: true,
      });
    }

    // 2. EIN_MISSING
    if (!claim.billing_provider_ein) {
      errors.push({
        code: 'EIN_MISSING',
        field: 'billing_provider_ein',
        message: 'Billing provider EIN is required',
        blocking: true,
      });
    }

    // 3. MEMBER_ID_MISSING
    if (!claim.subscriber_id) {
      errors.push({
        code: 'MEMBER_ID_MISSING',
        field: 'subscriber_id',
        message: 'Subscriber/member ID is required',
        blocking: true,
      });
    }

    // Get claim lines
    const lines = await this.claimLineDal.find({
      findOptions: { claim_id: claimId, org_id: orgId } as never,
      transactionOptions: { useTransaction: false },
    });

    // 4. NO_CLAIM_LINES
    if (lines.payload.length === 0) {
      errors.push({
        code: 'NO_CLAIM_LINES',
        message: 'Claim must have at least one line item',
        blocking: true,
      });
    }

    for (const line of lines.payload) {
      // 5. PROCEDURE_CODE_INVALID
      if (!line.procedure_code) {
        errors.push({
          code: 'PROCEDURE_CODE_INVALID',
          field: `line_${line.line_number}.procedure_code`,
          message: `Line ${line.line_number}: Procedure code is required`,
          blocking: true,
        });
      }

      // 6. DATE_OF_SERVICE_MISSING
      if (!line.service_date) {
        errors.push({
          code: 'DATE_OF_SERVICE_MISSING',
          field: `line_${line.line_number}.service_date`,
          message: `Line ${line.line_number}: Service date is required`,
          blocking: true,
        });
      }

      // 7. ZERO_CHARGE
      if (line.charge_cents <= 0) {
        errors.push({
          code: 'ZERO_CHARGE',
          field: `line_${line.line_number}.charge_cents`,
          message: `Line ${line.line_number}: Charge must be greater than zero`,
          blocking: true,
        });
      }

      // 8. ZERO_UNITS
      if (Number(line.units_billed) <= 0) {
        errors.push({
          code: 'ZERO_UNITS',
          field: `line_${line.line_number}.units_billed`,
          message: `Line ${line.line_number}: Units billed must be greater than zero`,
          blocking: true,
        });
      }
    }

    // 9. AUTH_NOT_FOUND
    if (claim.service_authorization_id) {
      const auth = await this.serviceAuthorizationDal.get({
        identifierOptions: {
          id: claim.service_authorization_id,
          org_id: orgId,
        } as never,
      });

      if (!auth) {
        warnings.push({
          code: 'AUTH_NOT_FOUND',
          message: 'Linked service authorization not found',
        });
      } else {
        // 10. AUTH_EXCEEDED
        const totalUsed = Number(auth.units_used) + Number(auth.units_pending);
        if (totalUsed > Number(auth.units_authorized)) {
          warnings.push({
            code: 'AUTH_EXCEEDED',
            message: `Authorization exceeded: ${totalUsed}/${auth.units_authorized} units`,
          });
        }
      }
    } else {
      warnings.push({
        code: 'AUTH_NOT_FOUND',
        message: 'No service authorization linked to claim',
      });
    }

    // 11. RATE_NOT_CONFIGURED — check via payer config
    const payerConfig = await this.payerConfigDal.get({
      identifierOptions: { id: claim.payer_config_id, org_id: orgId } as never,
    });

    if (!payerConfig || !payerConfig.active) {
      errors.push({
        code: 'RATE_NOT_CONFIGURED',
        message: 'Payer configuration is missing or inactive',
        blocking: true,
      });
    }

    // 12. DIAGNOSIS_REQUIRED
    const requiresDiagnosis = (payerConfig?.config as Record<string, boolean> | undefined)?.requires_diagnosis ?? false;
    if (
      requiresDiagnosis &&
      (!claim.diagnosis_codes || claim.diagnosis_codes.length === 0)
    ) {
      errors.push({
        code: 'DIAGNOSIS_REQUIRED',
        field: 'diagnosis_codes',
        message: 'Payer requires diagnosis codes',
        blocking: true,
      });
    }

    // 13. DUPLICATE_CLAIM
    const existingClaims = await this.claimDal.find({
      findOptions: {
        org_id: orgId,
        individual_id: claim.individual_id,
        service_date_from: claim.service_date_from,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    const duplicates = existingClaims.payload.filter(
      (c) => c.id !== claimId && c.status !== ClaimStatus.VOID,
    );

    if (duplicates.length > 0) {
      errors.push({
        code: 'DUPLICATE_CLAIM',
        message: 'Duplicate claim exists for same individual and date',
        blocking: true,
      });
    }

    const blockingErrors = errors.filter((e) => e.blocking);

    return {
      valid: blockingErrors.length === 0,
      errors,
      warnings,
    };
  }

  async validateAndStore(
    claimId: string,
    orgId: string,
  ): Promise<ClaimValidationResult> {
    const result = await this.validateClaim(claimId, orgId);

    await this.claimDal.update({
      identifierOptions: { id: claimId, org_id: orgId } as never,
      updatePayload: {
        validation_errors: { errors: result.errors, warnings: result.warnings },
        last_validated_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    return result;
  }
}
