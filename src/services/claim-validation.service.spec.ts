import { ClaimValidationService } from './claim-validation.service';

describe('ClaimValidationService', () => {
  let service: ClaimValidationService;
  let claimDal: { get: jest.Mock; find: jest.Mock; update: jest.Mock };
  let claimLineDal: { find: jest.Mock };
  let serviceCodeDal: { get: jest.Mock };
  let serviceAuthorizationDal: { get: jest.Mock };
  let payerConfigDal: { get: jest.Mock };
  let organizationDal: { get: jest.Mock };

  const mockClaimLine = {
    id: 'cl-uuid',
    line_number: 1,
    procedure_code: 'H2015',
    service_date: '2026-03-10',
    charge_cents: 6000,
    units_billed: 4,
  };

  const mockClaim = {
    id: 'claim-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    payer_config_id: 'pc-uuid',
    billing_provider_npi: '1234567890',
    billing_provider_ein: '123456789',
    subscriber_id: 'SUB-123',
    service_authorization_id: 'auth-uuid',
    service_date_from: '2026-03-10',
    diagnosis_codes: ['F84.0'],
    total_charge_cents: 6000,
    status: 'DRAFT',
  };

  const mockAuth = {
    id: 'auth-uuid',
    units_authorized: 100,
    units_used: 40,
    units_pending: 10,
  };

  const mockPayerConfig = {
    id: 'pc-uuid',
    active: true,
    config: { requires_diagnosis: false },
  };

  beforeEach(() => {
    claimDal = {
      get: jest.fn().mockResolvedValue(mockClaim),
      find: jest.fn().mockResolvedValue({ payload: [] }),
      update: jest.fn().mockResolvedValue(mockClaim),
    };
    claimLineDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockClaimLine] }),
    };
    serviceCodeDal = {
      get: jest.fn().mockResolvedValue({ id: 'sc-uuid', code: 'H2015' }),
    };
    serviceAuthorizationDal = {
      get: jest.fn().mockResolvedValue(mockAuth),
    };
    payerConfigDal = {
      get: jest.fn().mockResolvedValue(mockPayerConfig),
    };
    organizationDal = {
      get: jest.fn().mockResolvedValue({ id: 'org-uuid', npi: '1234567890' }),
    };

    service = new ClaimValidationService(
      claimDal as never,
      claimLineDal as never,
      serviceCodeDal as never,
      serviceAuthorizationDal as never,
      payerConfigDal as never,
      organizationDal as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateClaim', () => {
    it('should return valid for a fully valid claim', async () => {
      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return CLAIM_NOT_FOUND when claim does not exist', async () => {
      claimDal.get.mockResolvedValue(null);

      const result = await service.validateClaim('bad-id', 'org-uuid');

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'CLAIM_NOT_FOUND' }),
        ]),
      );
    });

    it('should return NPI_MISSING when billing_provider_npi is empty', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, billing_provider_npi: null });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'NPI_MISSING', blocking: true }),
        ]),
      );
    });

    it('should return EIN_MISSING when billing_provider_ein is empty', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, billing_provider_ein: null });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'EIN_MISSING', blocking: true }),
        ]),
      );
    });

    it('should return MEMBER_ID_MISSING when subscriber_id is empty', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, subscriber_id: null });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'MEMBER_ID_MISSING', blocking: true }),
        ]),
      );
    });

    it('should return NO_CLAIM_LINES when no claim lines exist', async () => {
      claimLineDal.find.mockResolvedValue({ payload: [] });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'NO_CLAIM_LINES', blocking: true }),
        ]),
      );
    });

    it('should return PROCEDURE_CODE_INVALID when line has no procedure code', async () => {
      claimLineDal.find.mockResolvedValue({
        payload: [{ ...mockClaimLine, procedure_code: '' }],
      });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'PROCEDURE_CODE_INVALID', blocking: true }),
        ]),
      );
    });

    it('should return DATE_OF_SERVICE_MISSING when line has no service date', async () => {
      claimLineDal.find.mockResolvedValue({
        payload: [{ ...mockClaimLine, service_date: null }],
      });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'DATE_OF_SERVICE_MISSING', blocking: true }),
        ]),
      );
    });

    it('should return ZERO_CHARGE when line has zero charge', async () => {
      claimLineDal.find.mockResolvedValue({
        payload: [{ ...mockClaimLine, charge_cents: 0 }],
      });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'ZERO_CHARGE', blocking: true }),
        ]),
      );
    });

    it('should return ZERO_UNITS when line has zero units', async () => {
      claimLineDal.find.mockResolvedValue({
        payload: [{ ...mockClaimLine, units_billed: 0 }],
      });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'ZERO_UNITS', blocking: true }),
        ]),
      );
    });

    it('should return AUTH_NOT_FOUND warning when authorization not found', async () => {
      serviceAuthorizationDal.get.mockResolvedValue(null);

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'AUTH_NOT_FOUND' }),
        ]),
      );
    });

    it('should return AUTH_NOT_FOUND warning when no auth linked to claim', async () => {
      claimDal.get.mockResolvedValue({ ...mockClaim, service_authorization_id: null });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'AUTH_NOT_FOUND' }),
        ]),
      );
    });

    it('should return AUTH_EXCEEDED warning when units exceed authorized', async () => {
      serviceAuthorizationDal.get.mockResolvedValue({
        ...mockAuth,
        units_authorized: 100,
        units_used: 90,
        units_pending: 20,
      });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'AUTH_EXCEEDED' }),
        ]),
      );
    });

    it('should return RATE_NOT_CONFIGURED when payer config is inactive', async () => {
      payerConfigDal.get.mockResolvedValue({ ...mockPayerConfig, active: false });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'RATE_NOT_CONFIGURED', blocking: true }),
        ]),
      );
    });

    it('should return RATE_NOT_CONFIGURED when payer config is missing', async () => {
      payerConfigDal.get.mockResolvedValue(null);

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'RATE_NOT_CONFIGURED', blocking: true }),
        ]),
      );
    });

    it('should return DIAGNOSIS_REQUIRED when payer requires diagnosis but none provided', async () => {
      payerConfigDal.get.mockResolvedValue({
        ...mockPayerConfig,
        config: { requires_diagnosis: true },
      });
      claimDal.get.mockResolvedValue({ ...mockClaim, diagnosis_codes: [] });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'DIAGNOSIS_REQUIRED', blocking: true }),
        ]),
      );
    });

    it('should return DUPLICATE_CLAIM when duplicate exists', async () => {
      claimDal.find.mockResolvedValue({
        payload: [{ id: 'other-claim-uuid', status: 'SUBMITTED' }],
      });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'DUPLICATE_CLAIM', blocking: true }),
        ]),
      );
    });

    it('should not flag DUPLICATE_CLAIM for voided duplicates', async () => {
      claimDal.find.mockResolvedValue({
        payload: [{ id: 'other-claim-uuid', status: 'VOID' }],
      });

      const result = await service.validateClaim('claim-uuid', 'org-uuid');

      const duplicateErrors = result.errors.filter((e) => e.code === 'DUPLICATE_CLAIM');
      expect(duplicateErrors).toHaveLength(0);
    });
  });

  describe('validateAndStore', () => {
    it('should store validation results on the claim', async () => {
      await service.validateAndStore('claim-uuid', 'org-uuid');

      expect(claimDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            id: 'claim-uuid',
            org_id: 'org-uuid',
          }) as unknown,
          updatePayload: expect.objectContaining({
            validation_errors: expect.objectContaining({
              errors: expect.any(Array) as unknown,
              warnings: expect.any(Array) as unknown,
            }) as unknown,
            last_validated_at: expect.any(Date) as unknown,
          }) as unknown,
        }),
      );
    });

    it('should return the validation result', async () => {
      const result = await service.validateAndStore('claim-uuid', 'org-uuid');

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });
});
