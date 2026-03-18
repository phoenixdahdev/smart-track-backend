import { ClaimsAnalyticsService } from './claims-analytics.service';
import { ClaimStatus } from '@enums/claim-status.enum';

describe('ClaimsAnalyticsService', () => {
  let service: ClaimsAnalyticsService;
  let claimDal: { find: jest.Mock };

  const now = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  };

  const mockClaim = (overrides: Record<string, unknown> = {}) => ({
    id: 'claim-uuid',
    org_id: 'org-uuid',
    payer_config_id: 'pc-uuid',
    individual_id: 'ind-uuid',
    total_charge_cents: 10000,
    paid_amount_cents: 0,
    balance_cents: 10000,
    status: ClaimStatus.SUBMITTED,
    submitted_at: daysAgo(10),
    paid_at: null,
    created_at: daysAgo(15),
    updated_at: daysAgo(5),
    service_date_from: '2026-03-01',
    denial_reason_codes: [],
    ...overrides,
  });

  beforeEach(() => {
    claimDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockClaim()] }),
    };
    service = new ClaimsAnalyticsService(claimDal as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClaimsLifecycle', () => {
    it('should count claims by status', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ status: ClaimStatus.SUBMITTED }),
          mockClaim({ id: 'c2', status: ClaimStatus.PAID, paid_at: daysAgo(2) }),
          mockClaim({ id: 'c3', status: ClaimStatus.DENIED, denial_reason_codes: ['CO-4'] }),
        ],
      });

      const result = await service.getClaimsLifecycle('org-uuid');

      expect(result.total_claims).toBe(3);
      expect(result.by_status.length).toBeGreaterThanOrEqual(2);
    });

    it('should exclude VOID and DRAFT claims', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ status: ClaimStatus.VOID }),
          mockClaim({ status: ClaimStatus.DRAFT }),
        ],
      });

      const result = await service.getClaimsLifecycle('org-uuid');

      expect(result.total_claims).toBe(0);
    });

    it('should calculate avg days draft to submitted', async () => {
      // Use exact Date objects to avoid off-by-one from daysAgo rounding
      const created = new Date('2026-01-01T00:00:00Z');
      const submitted = new Date('2026-01-11T00:00:00Z');
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ created_at: created, submitted_at: submitted }),
        ],
      });

      const result = await service.getClaimsLifecycle('org-uuid');

      expect(result.avg_days_draft_to_submitted).toBe(10);
    });

    it('should calculate avg days submitted to paid', async () => {
      const submitted = new Date('2026-01-01T00:00:00Z');
      const paid = new Date('2026-01-21T00:00:00Z');
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({
            status: ClaimStatus.PAID,
            submitted_at: submitted,
            paid_at: paid,
          }),
        ],
      });

      const result = await service.getClaimsLifecycle('org-uuid');

      expect(result.avg_days_submitted_to_paid).toBe(20);
    });

    it('should calculate avg days submitted to denied', async () => {
      const submitted = new Date('2026-01-01T00:00:00Z');
      const updated = new Date('2026-01-16T00:00:00Z');
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({
            status: ClaimStatus.DENIED,
            submitted_at: submitted,
            updated_at: updated,
            denial_reason_codes: ['CO-4'],
          }),
        ],
      });

      const result = await service.getClaimsLifecycle('org-uuid');

      expect(result.avg_days_submitted_to_denied).toBe(15);
    });

    it('should aggregate denial reason codes', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ id: 'c1', status: ClaimStatus.DENIED, denial_reason_codes: ['CO-4', 'CO-16'] }),
          mockClaim({ id: 'c2', status: ClaimStatus.DENIED, denial_reason_codes: ['CO-4'] }),
        ],
      });

      const result = await service.getClaimsLifecycle('org-uuid');

      expect(result.denial_analysis).toHaveLength(2);
      const co4 = result.denial_analysis.find((d) => d.reason_code === 'CO-4');
      expect(co4?.count).toBe(2);
    });

    it('should filter by date range', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ submitted_at: new Date('2026-01-01') }),
          mockClaim({ id: 'c2', submitted_at: new Date('2026-03-15') }),
        ],
      });

      const result = await service.getClaimsLifecycle('org-uuid', {
        date_from: '2026-03-01',
      });

      expect(result.total_claims).toBe(1);
    });

    it('should apply payer_config_id filter to DAL', async () => {
      await service.getClaimsLifecycle('org-uuid', { payer_config_id: 'pc-uuid' });

      expect(claimDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            payer_config_id: 'pc-uuid',
          }) as unknown,
        }),
      );
    });

    it('should pass pagination limit to DAL', async () => {
      await service.getClaimsLifecycle('org-uuid');

      expect(claimDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { limit: 50000, page: 1 },
        }),
      );
    });

    it('should return zero averages when no qualifying claims', async () => {
      claimDal.find.mockResolvedValue({ payload: [] });

      const result = await service.getClaimsLifecycle('org-uuid');

      expect(result.avg_days_draft_to_submitted).toBe(0);
      expect(result.avg_days_submitted_to_paid).toBe(0);
      expect(result.avg_days_submitted_to_denied).toBe(0);
    });
  });

  describe('getDenialAnalysis', () => {
    it('should return denial analysis from lifecycle report', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ status: ClaimStatus.DENIED, denial_reason_codes: ['CO-4'] }),
        ],
      });

      const result = await service.getDenialAnalysis('org-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].reason_code).toBe('CO-4');
      expect(result[0].percentage).toBe(100);
    });
  });
});
