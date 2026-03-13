import { AdminClaimController } from './admin-claim.controller';

describe('AdminClaimController', () => {
  let controller: AdminClaimController;
  let claimService: {
    list: jest.Mock;
    findById: jest.Mock;
    getStatusHistory: jest.Mock;
  };

  const mockClaim = {
    id: 'claim-uuid',
    org_id: 'org-uuid',
    status: 'DRAFT',
    total_charge_cents: 6000,
  };

  beforeEach(() => {
    claimService = {
      list: jest.fn().mockResolvedValue({
        payload: [mockClaim],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockClaim),
      getStatusHistory: jest.fn().mockResolvedValue({
        payload: [{ from_status: null, to_status: 'DRAFT' }],
      }),
    };

    controller = new AdminClaimController(claimService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/claims', () => {
    it('should list claims', async () => {
      const result = await controller.list('org-uuid', {} as never);
      expect(result.message).toBe('Claims retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /admin/claims/:id', () => {
    it('should get claim by ID', async () => {
      const result = await controller.findById('claim-uuid', 'org-uuid');
      expect(result.message).toBe('Claim retrieved');
    });
  });

  describe('GET /admin/claims/:id/history', () => {
    it('should get status history', async () => {
      const result = await controller.history('claim-uuid', 'org-uuid');
      expect(result.message).toBe('Status history retrieved');
      expect(result.data).toHaveLength(1);
    });
  });
});
