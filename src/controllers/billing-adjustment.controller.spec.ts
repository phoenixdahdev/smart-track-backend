import { BillingAdjustmentController } from './billing-adjustment.controller';

describe('BillingAdjustmentController', () => {
  let controller: BillingAdjustmentController;
  let paymentPostingService: {
    listAdjustmentsByClaim: jest.Mock;
    listAdjustmentsByPaymentPost: jest.Mock;
  };

  const mockAdj = {
    id: 'adj-uuid',
    claim_line_id: 'line-uuid',
    payment_post_id: 'post-uuid',
    type: 'CONTRACTUAL',
    reason_code: '45',
    adjustment_amount_cents: 2000,
  };

  beforeEach(() => {
    paymentPostingService = {
      listAdjustmentsByClaim: jest.fn().mockResolvedValue([mockAdj]),
      listAdjustmentsByPaymentPost: jest.fn().mockResolvedValue({
        payload: [mockAdj],
      }),
    };

    controller = new BillingAdjustmentController(paymentPostingService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /billing/adjustments/by-claim/:claimId', () => {
    it('should return adjustments for a claim', async () => {
      const result = await controller.byClaim('claim-uuid', 'org-uuid');

      expect(result.message).toBe('Adjustments retrieved');
      expect(result.data).toHaveLength(1);
      expect(paymentPostingService.listAdjustmentsByClaim).toHaveBeenCalledWith(
        'claim-uuid', 'org-uuid',
      );
    });
  });

  describe('GET /billing/adjustments/by-payment-post/:paymentPostId', () => {
    it('should return adjustments for a payment post', async () => {
      const result = await controller.byPaymentPost('post-uuid', 'org-uuid');

      expect(result.message).toBe('Adjustments retrieved');
      expect(result.data).toHaveLength(1);
      expect(paymentPostingService.listAdjustmentsByPaymentPost).toHaveBeenCalledWith(
        'post-uuid', 'org-uuid',
      );
    });
  });
});
