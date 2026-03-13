import { NotFoundException } from '@nestjs/common';
import { EdiGeneratorService } from './edi-generator.service';

describe('EdiGeneratorService', () => {
  let service: EdiGeneratorService;
  let claimDal: { get: jest.Mock; find: jest.Mock };
  let claimLineDal: { find: jest.Mock };
  let payerConfigDal: { get: jest.Mock };
  let organizationDal: { get: jest.Mock };
  let individualDal: { get: jest.Mock };

  const mockClaim = {
    id: 'claim-uuid',
    org_id: 'org-uuid',
    claim_type: 'PROFESSIONAL_837P',
    billing_provider_npi: '1234567890',
    billing_provider_ein: '123456789',
    billing_provider_name: 'Test Agency',
    billing_provider_address: { line1: '123 Main St', city: 'Springfield', state: 'IL', zip: '62701' },
    subscriber_id: 'SUB-123',
    individual_id: 'ind-uuid',
    payer_config_id: 'pc-uuid',
    service_date_from: '2026-03-10',
    service_date_through: '2026-03-10',
    frequency_code: '1',
    place_of_service: '12',
    diagnosis_codes: ['F70'],
    total_charge_cents: 6000,
  };

  const mockLine = {
    line_number: 1,
    procedure_code: 'H2015',
    modifiers: [],
    service_date: '2026-03-10',
    units_billed: 4,
    charge_cents: 6000,
    rendering_provider_npi: null,
    place_of_service: '12',
    diagnosis_pointer: [1],
  };

  const mockPayerConfig = {
    id: 'pc-uuid',
    payer_id_edi: 'EDI001',
    payer_name: 'Test Payer',
    clearinghouse_routing: { id: 'CH001' },
  };

  const mockIndividual = {
    id: 'ind-uuid',
    first_name: 'John',
    last_name: 'Doe',
  };

  beforeEach(() => {
    claimDal = {
      get: jest.fn().mockResolvedValue(mockClaim),
      find: jest.fn().mockResolvedValue({ payload: [], paginationMeta: {} }),
    };
    claimLineDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockLine], paginationMeta: {} }),
    };
    payerConfigDal = {
      get: jest.fn().mockResolvedValue(mockPayerConfig),
    };
    organizationDal = {
      get: jest.fn().mockResolvedValue(null),
    };
    individualDal = {
      get: jest.fn().mockResolvedValue(mockIndividual),
    };

    service = new EdiGeneratorService(
      claimDal as never,
      claimLineDal as never,
      payerConfigDal as never,
      organizationDal as never,
      individualDal as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildClearinghousePayload', () => {
    it('should build a complete payload', async () => {
      const result = await service.buildClearinghousePayload('claim-uuid', 'org-uuid');

      expect(result.claim_id).toBe('claim-uuid');
      expect(result.claim_type).toBe('PROFESSIONAL_837P');
      expect(result.billing_provider.npi).toBe('1234567890');
      expect(result.subscriber.subscriber_id).toBe('SUB-123');
      expect(result.subscriber.first_name).toBe('John');
      expect(result.payer.payer_id).toBe('EDI001');
      expect(result.claim_info.total_charge_cents).toBe(6000);
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0].procedure_code).toBe('H2015');
    });

    it('should throw when claim not found', async () => {
      claimDal.get.mockResolvedValue(null);

      await expect(
        service.buildClearinghousePayload('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle missing individual gracefully', async () => {
      individualDal.get.mockResolvedValue(null);

      const result = await service.buildClearinghousePayload('claim-uuid', 'org-uuid');

      expect(result.subscriber.first_name).toBe('');
      expect(result.subscriber.last_name).toBe('');
    });

    it('should handle missing payer config gracefully', async () => {
      payerConfigDal.get.mockResolvedValue(null);

      const result = await service.buildClearinghousePayload('claim-uuid', 'org-uuid');

      expect(result.payer.payer_id).toBe('');
    });

    it('should include multiple lines', async () => {
      claimLineDal.find.mockResolvedValue({
        payload: [mockLine, { ...mockLine, line_number: 2, procedure_code: 'T2020' }],
        paginationMeta: {},
      });

      const result = await service.buildClearinghousePayload('claim-uuid', 'org-uuid');

      expect(result.lines).toHaveLength(2);
    });
  });

  describe('buildBatchPayload', () => {
    it('should build payloads for multiple claims', async () => {
      const result = await service.buildBatchPayload(['claim-1', 'claim-2'], 'org-uuid');

      expect(result.claim_count).toBe(2);
      expect(result.claims).toHaveLength(2);
      expect(result.batch_id).toMatch(/^BATCH-/);
    });

    it('should return empty for no claims', async () => {
      const result = await service.buildBatchPayload([], 'org-uuid');

      expect(result.claim_count).toBe(0);
      expect(result.claims).toHaveLength(0);
    });
  });
});
