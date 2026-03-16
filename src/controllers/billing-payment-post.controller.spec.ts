import { BadRequestException } from '@nestjs/common';
import { BillingPaymentPostController } from './billing-payment-post.controller';

describe('BillingPaymentPostController', () => {
  let controller: BillingPaymentPostController;
  let paymentPostingService: {
    listPaymentPosts: jest.Mock;
    findPaymentPostById: jest.Mock;
    postPayment: jest.Mock;
  };
  let paymentMatchingService: {
    listUnmatched: jest.Mock;
    manualMatch: jest.Mock;
    unmatch: jest.Mock;
  };

  const mockPost = {
    id: 'post-uuid',
    org_id: 'org-uuid',
    remittance_id: 'rem-uuid',
    claim_id: null,
    billed_cents: 10000,
    paid_cents: 8000,
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

  const mockReq = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    paymentPostingService = {
      listPaymentPosts: jest.fn().mockResolvedValue({
        payload: [mockPost],
        paginationMeta: { total: 1, limit: 20, page: 1, total_pages: 1, has_next: false, has_previous: false },
      }),
      findPaymentPostById: jest.fn().mockResolvedValue(mockPost),
      postPayment: jest.fn().mockResolvedValue(mockPost),
    };
    paymentMatchingService = {
      listUnmatched: jest.fn().mockResolvedValue({
        payload: [mockPost],
        paginationMeta: { total: 1, limit: 20, page: 1, total_pages: 1, has_next: false, has_previous: false },
      }),
      manualMatch: jest.fn().mockResolvedValue({ ...mockPost, claim_id: 'claim-uuid' }),
      unmatch: jest.fn().mockResolvedValue({ ...mockPost, claim_id: null }),
    };

    controller = new BillingPaymentPostController(
      paymentPostingService as never,
      paymentMatchingService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /billing/payment-posts', () => {
    it('should list payment posts', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('Payment posts retrieved');
      expect(result.data).toHaveLength(1);
    });

    it('should throw BadRequestException when user has no org_id', async () => {
      const noOrgUser = { ...mockCurrentUser, org_id: null };

      await expect(
        controller.list(noOrgUser as never, {} as never),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /billing/payment-posts/unmatched', () => {
    it('should list unmatched posts', async () => {
      const result = await controller.listUnmatched(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('Unmatched payment posts retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /billing/payment-posts/:id', () => {
    it('should get a post by ID', async () => {
      const result = await controller.findById('post-uuid', 'org-uuid');

      expect(result.message).toBe('Payment post retrieved');
      expect(result.data.id).toBe('post-uuid');
    });
  });

  describe('POST /billing/payment-posts/:id/match', () => {
    it('should manually match a post', async () => {
      const dto = { claim_id: 'claim-uuid' };

      const result = await controller.match(
        'post-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Payment post matched');
      expect(paymentMatchingService.manualMatch).toHaveBeenCalledWith(
        'post-uuid', 'claim-uuid', 'org-uuid', 'billing-uuid', 'BILLING_SPECIALIST',
        '127.0.0.1', 'jest',
      );
    });
  });

  describe('POST /billing/payment-posts/:id/unmatch', () => {
    it('should unmatch a post', async () => {
      const result = await controller.unmatch(
        'post-uuid', mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Payment post unmatched');
      expect(paymentMatchingService.unmatch).toHaveBeenCalledWith(
        'post-uuid', 'org-uuid', 'billing-uuid', 'BILLING_SPECIALIST',
        '127.0.0.1', 'jest',
      );
    });
  });

  describe('POST /billing/payment-posts/:id/post', () => {
    it('should post a payment', async () => {
      const result = await controller.postPayment(
        'post-uuid', mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Payment posted');
      expect(paymentPostingService.postPayment).toHaveBeenCalledWith(
        'post-uuid', 'org-uuid', 'billing-uuid', 'BILLING_SPECIALIST',
        '127.0.0.1', 'jest',
      );
    });
  });
});
