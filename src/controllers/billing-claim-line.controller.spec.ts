import { BillingClaimLineController } from './billing-claim-line.controller';

describe('BillingClaimLineController', () => {
  let controller: BillingClaimLineController;
  let claimLineService: {
    findByClaimId: jest.Mock;
    addLine: jest.Mock;
    updateLine: jest.Mock;
    removeLine: jest.Mock;
  };

  const mockCurrentUser = {
    id: 'user-uuid',
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

  const mockLine = {
    id: 'line-uuid',
    claim_id: 'claim-uuid',
    procedure_code: 'H2015',
    charge_cents: 6000,
  };

  beforeEach(() => {
    claimLineService = {
      findByClaimId: jest.fn().mockResolvedValue({
        payload: [mockLine],
        paginationMeta: {},
      }),
      addLine: jest.fn().mockResolvedValue(mockLine),
      updateLine: jest.fn().mockResolvedValue(mockLine),
      removeLine: jest.fn().mockResolvedValue(undefined),
    };

    controller = new BillingClaimLineController(claimLineService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /billing/claims/:claimId/lines', () => {
    it('should list claim lines', async () => {
      const result = await controller.list('claim-uuid', 'org-uuid');
      expect(result.message).toBe('Claim lines retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('POST /billing/claims/:claimId/lines', () => {
    it('should add a line', async () => {
      const dto = {
        service_code_id: 'sc-uuid',
        procedure_code: 'H2015',
        service_date: '2026-03-10',
        units_billed: 4,
        charge_cents: 6000,
      };
      const result = await controller.addLine(
        'claim-uuid', dto as never, mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Claim line added');
    });
  });

  describe('PATCH /billing/claims/:claimId/lines/:lineId', () => {
    it('should update a line', async () => {
      const result = await controller.updateLine(
        'claim-uuid', 'line-uuid', { charge_cents: 7000 } as never,
        mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Claim line updated');
    });
  });

  describe('DELETE /billing/claims/:claimId/lines/:lineId', () => {
    it('should remove a line', async () => {
      const result = await controller.removeLine(
        'claim-uuid', 'line-uuid', mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Claim line removed');
    });
  });
});
