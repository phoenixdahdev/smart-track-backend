import { BadRequestException } from '@nestjs/common';
import { BillingRemittanceController } from './billing-remittance.controller';
import { RemittanceStatus } from '@enums/remittance-status.enum';

describe('BillingRemittanceController', () => {
  let controller: BillingRemittanceController;
  let remittanceService: {
    ingestEra: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    getPaymentPosts: jest.Mock;
    recalculateStatus: jest.Mock;
  };

  const mockRemittance = {
    id: 'rem-uuid',
    org_id: 'org-uuid',
    status: RemittanceStatus.RECEIVED,
    eft_total_cents: 150000,
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
    remittanceService = {
      ingestEra: jest.fn().mockResolvedValue({
        ...mockRemittance,
        status: RemittanceStatus.FULLY_POSTED,
        matched_count: 1,
        total_count: 1,
      }),
      findById: jest.fn().mockResolvedValue(mockRemittance),
      list: jest.fn().mockResolvedValue({
        payload: [mockRemittance],
        paginationMeta: { total: 1, limit: 20, page: 1, total_pages: 1, has_next: false, has_previous: false },
      }),
      getPaymentPosts: jest.fn().mockResolvedValue({
        payload: [{ id: 'post-uuid', remittance_id: 'rem-uuid' }],
      }),
      recalculateStatus: jest.fn().mockResolvedValue({
        remittance_id: 'rem-uuid',
        status: RemittanceStatus.FULLY_POSTED,
        total: 1,
        matched: 1,
      }),
    };

    controller = new BillingRemittanceController(remittanceService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /billing/remittances', () => {
    const dto = {
      payer_config_id: 'pc-uuid',
      payment_date: '2026-03-15',
      eft_trace_number: 'EFT-001',
      eft_total_cents: 150000,
      claim_payments: [{ claim_id: 'claim-uuid', billed_cents: 10000, paid_cents: 8000 }],
    };

    it('should ingest ERA', async () => {
      const result = await controller.ingest(dto as never, mockCurrentUser as never, mockReq as never);

      expect(result.message).toBe('ERA ingested');
      expect(remittanceService.ingestEra).toHaveBeenCalledWith(
        dto, 'org-uuid', 'billing-uuid', 'BILLING_SPECIALIST', '127.0.0.1', 'jest',
      );
    });

    it('should throw BadRequestException when user has no org_id', async () => {
      const noOrgUser = { ...mockCurrentUser, org_id: null };

      await expect(
        controller.ingest(dto as never, noOrgUser as never, mockReq as never),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /billing/remittances', () => {
    it('should list remittances', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('Remittances retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /billing/remittances/:id', () => {
    it('should get remittance by ID', async () => {
      const result = await controller.findById('rem-uuid', 'org-uuid');

      expect(result.message).toBe('Remittance retrieved');
      expect(result.data.id).toBe('rem-uuid');
    });
  });

  describe('GET /billing/remittances/:id/payment-posts', () => {
    it('should get payment posts for a remittance', async () => {
      const result = await controller.getPaymentPosts('rem-uuid', 'org-uuid');

      expect(result.message).toBe('Payment posts retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('POST /billing/remittances/:id/recalculate', () => {
    it('should recalculate remittance status', async () => {
      const result = await controller.recalculate('rem-uuid', 'org-uuid');

      expect(result.message).toBe('Remittance status recalculated');
      expect(remittanceService.recalculateStatus).toHaveBeenCalledWith('rem-uuid', 'org-uuid');
    });
  });
});
