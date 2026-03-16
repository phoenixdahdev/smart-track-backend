import { BadRequestException } from '@nestjs/common';
import { AdminRemittanceController } from './admin-remittance.controller';
import { RemittanceStatus } from '@enums/remittance-status.enum';

describe('AdminRemittanceController', () => {
  let controller: AdminRemittanceController;
  let remittanceService: {
    findById: jest.Mock;
    list: jest.Mock;
    getPaymentPosts: jest.Mock;
  };

  const mockRemittance = {
    id: 'rem-uuid',
    org_id: 'org-uuid',
    status: RemittanceStatus.FULLY_POSTED,
    eft_total_cents: 150000,
  };

  const mockCurrentUser = {
    id: 'admin-uuid',
    org_id: 'org-uuid',
    role: 'ADMIN',
    email: 'admin@test.com',
    name: 'Admin User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  beforeEach(() => {
    remittanceService = {
      findById: jest.fn().mockResolvedValue(mockRemittance),
      list: jest.fn().mockResolvedValue({
        payload: [mockRemittance],
        paginationMeta: { total: 1, limit: 20, page: 1, total_pages: 1, has_next: false, has_previous: false },
      }),
      getPaymentPosts: jest.fn().mockResolvedValue({
        payload: [{ id: 'post-uuid', remittance_id: 'rem-uuid' }],
      }),
    };

    controller = new AdminRemittanceController(remittanceService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/remittances', () => {
    it('should list remittances', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('Remittances retrieved');
      expect(result.data).toHaveLength(1);
    });

    it('should throw BadRequestException when user has no org_id', async () => {
      const noOrgUser = { ...mockCurrentUser, org_id: null };

      await expect(
        controller.list(noOrgUser as never, {} as never),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /admin/remittances/:id', () => {
    it('should get remittance by ID', async () => {
      const result = await controller.findById('rem-uuid', 'org-uuid');

      expect(result.message).toBe('Remittance retrieved');
      expect(result.data.id).toBe('rem-uuid');
    });
  });

  describe('GET /admin/remittances/:id/payment-posts', () => {
    it('should get payment posts', async () => {
      const result = await controller.getPaymentPosts('rem-uuid', 'org-uuid');

      expect(result.message).toBe('Payment posts retrieved');
      expect(result.data).toHaveLength(1);
    });
  });
});
