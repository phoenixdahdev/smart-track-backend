import { BillingIndividualPayerCoverageController } from './billing-individual-payer-coverage.controller';

describe('BillingIndividualPayerCoverageController', () => {
  let controller: BillingIndividualPayerCoverageController;
  let coverageService: {
    list: jest.Mock;
    findById: jest.Mock;
    listByIndividual: jest.Mock;
  };

  const mockRecord = {
    id: 'cov-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    payer_config_id: 'pc-uuid',
    subscriber_id: 'SUB-001',
    active: true,
  };

  beforeEach(() => {
    coverageService = {
      list: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockRecord),
      listByIndividual: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
    };

    controller = new BillingIndividualPayerCoverageController(
      coverageService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /billing/individual-payer-coverages', () => {
    it('should list coverages', async () => {
      const result = await controller.list('org-uuid', {} as never);

      expect(result.message).toBe('Coverages retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /billing/individual-payer-coverages/:id', () => {
    it('should get coverage by id', async () => {
      const result = await controller.findById('cov-uuid', 'org-uuid');

      expect(result.message).toBe('Coverage retrieved');
      expect(result.data.id).toBe('cov-uuid');
    });
  });

  describe('GET /billing/individual-payer-coverages/by-individual/:individualId', () => {
    it('should list coverages by individual', async () => {
      const result = await controller.listByIndividual(
        'ind-uuid', 'org-uuid', {} as never,
      );

      expect(result.message).toBe('Coverages retrieved');
      expect(result.data).toHaveLength(1);
      expect(coverageService.listByIndividual).toHaveBeenCalledWith(
        'ind-uuid', 'org-uuid', {},
      );
    });
  });
});
