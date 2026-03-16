import { BillingQueueController } from './billing-queue.controller';

describe('BillingQueueController', () => {
  let controller: BillingQueueController;
  let billingQueueService: {
    getQueue: jest.Mock;
    enrichQueueItem: jest.Mock;
  };

  const mockQueueItem = {
    id: 'sr-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    service_date: '2026-03-10',
    status: 'APPROVED',
  };

  const mockCurrentUser = {
    id: 'billing-uuid',
    org_id: 'org-uuid',
    role: 'BILLING_SPECIALIST',
    email: 'billing@test.com',
    name: 'Billing User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  beforeEach(() => {
    billingQueueService = {
      getQueue: jest.fn().mockResolvedValue({
        payload: [mockQueueItem],
        paginationMeta: { total: 1, limit: 20, page: 1, total_pages: 1, has_next: false, has_previous: false },
      }),
      enrichQueueItem: jest.fn().mockResolvedValue({
        service_record: mockQueueItem,
        coverages: [],
        authorization: null,
        flags: ['NO_PAYER_COVERAGE', 'NO_AUTHORIZATION'],
      }),
    };

    controller = new BillingQueueController(billingQueueService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /billing/queue', () => {
    it('should get the billing queue', async () => {
      const query = { page: '1', limit: '20' };

      const result = await controller.getQueue(
        mockCurrentUser as never, query as never,
      );

      expect(result.message).toBe('Billing queue retrieved');
      expect(result.data).toHaveLength(1);
      expect(billingQueueService.getQueue).toHaveBeenCalledWith(
        'org-uuid', query,
        expect.objectContaining({
          date_from: undefined,
          date_to: undefined,
          individual_id: undefined,
          program_id: undefined,
        }),
      );
    });
  });

  describe('GET /billing/queue/:serviceRecordId/details', () => {
    it('should get enriched details for a queue item', async () => {
      const result = await controller.enrichQueueItem(
        'sr-uuid', mockCurrentUser as never,
      );

      expect(result.message).toBe('Queue item details retrieved');
      expect(result.data.service_record.id).toBe('sr-uuid');
      expect(billingQueueService.enrichQueueItem).toHaveBeenCalledWith(
        'sr-uuid', 'org-uuid',
      );
    });
  });
});
