import { BillingClaimSubmissionController } from './billing-claim-submission.controller';

describe('BillingClaimSubmissionController', () => {
  let controller: BillingClaimSubmissionController;
  let claimSubmissionService: {
    submitClaim: jest.Mock;
    submitBatch: jest.Mock;
    list: jest.Mock;
    findById: jest.Mock;
    recordResponse: jest.Mock;
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
    email_verified: true,
  };

  const mockReq = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  const mockSubmission = {
    id: 'sub-uuid',
    claim_id: 'claim-uuid',
    submitted_at: new Date(),
  };

  beforeEach(() => {
    claimSubmissionService = {
      submitClaim: jest.fn().mockResolvedValue(mockSubmission),
      submitBatch: jest.fn().mockResolvedValue([mockSubmission]),
      list: jest.fn().mockResolvedValue({
        payload: [mockSubmission],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockSubmission),
      recordResponse: jest.fn().mockResolvedValue(mockSubmission),
    };

    controller = new BillingClaimSubmissionController(
      claimSubmissionService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /billing/claim-submissions/submit', () => {
    it('should submit a claim', async () => {
      const result = await controller.submit(
        'claim-uuid',
        mockCurrentUser as never,
        mockReq as never,
      );
      expect(result.message).toBe('Claim submitted');
      expect(result.data.id).toBe('sub-uuid');
    });
  });

  describe('POST /billing/claim-submissions/submit-batch', () => {
    it('should submit batch of claims', async () => {
      const result = await controller.submitBatch(
        { claim_ids: ['claim-1'] },
        mockCurrentUser as never,
        mockReq as never,
      );
      expect(result.message).toBe('Claims submitted');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /billing/claim-submissions', () => {
    it('should list submissions', async () => {
      const result = await controller.list('org-uuid', {} as never);
      expect(result.message).toBe('Claim submissions retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /billing/claim-submissions/:id', () => {
    it('should get submission by ID', async () => {
      const result = await controller.findById('sub-uuid', 'org-uuid');
      expect(result.message).toBe('Submission retrieved');
    });
  });

  describe('POST /billing/claim-submissions/:id/response', () => {
    it('should record response', async () => {
      const result = await controller.recordResponse(
        'sub-uuid',
        { response_status: 'ACCEPTED', response_details: {} },
        mockCurrentUser as never,
        mockReq as never,
      );
      expect(result.message).toBe('Response recorded');
    });
  });
});
