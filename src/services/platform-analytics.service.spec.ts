import { PlatformAnalyticsService } from './platform-analytics.service';
import { OrgStatus } from '@enums/org-status.enum';
import { SubscriptionStatus } from '@enums/subscription-status.enum';
import { ClaimStatus } from '@enums/claim-status.enum';
import { UserStatus } from '@enums/user-status.enum';

describe('PlatformAnalyticsService', () => {
  let service: PlatformAnalyticsService;
  let organizationDal: { find: jest.Mock };
  let subscriptionDal: { find: jest.Mock };
  let claimDal: { find: jest.Mock };
  let userDal: { find: jest.Mock };

  const now = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  };

  const mockOrg = (overrides: Record<string, unknown> = {}) => ({
    id: 'org-1',
    legal_name: 'Test Agency',
    status: OrgStatus.ACTIVE,
    plan_tier: 'professional',
    ...overrides,
  });

  const mockSubscription = (overrides: Record<string, unknown> = {}) => ({
    id: 'sub-1',
    org_id: 'org-1',
    plan_tier: 'professional',
    status: SubscriptionStatus.ACTIVE,
    mrr_cents: 29900,
    ...overrides,
  });

  const mockClaim = (overrides: Record<string, unknown> = {}) => ({
    id: 'claim-1',
    org_id: 'org-1',
    status: ClaimStatus.SUBMITTED,
    submitted_at: daysAgo(10),
    ...overrides,
  });

  const mockUser = (overrides: Record<string, unknown> = {}) => ({
    id: 'user-1',
    org_id: 'org-1',
    status: UserStatus.ACTIVE,
    name: 'User',
    ...overrides,
  });

  beforeEach(() => {
    organizationDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockOrg()] }),
    };
    subscriptionDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockSubscription()] }),
    };
    claimDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockClaim()] }),
    };
    userDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockUser()] }),
    };

    service = new PlatformAnalyticsService(
      organizationDal as never,
      subscriptionDal as never,
      claimDal as never,
      userDal as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlatformAnalytics', () => {
    it('should return total and active agency counts', async () => {
      const result = await service.getPlatformAnalytics();

      expect(result.total_agencies).toBe(1);
      expect(result.active_agencies).toBe(1);
    });

    it('should aggregate agencies by status', async () => {
      organizationDal.find.mockResolvedValueOnce({
        payload: [
          mockOrg({ id: 'o1', status: OrgStatus.ACTIVE }),
          mockOrg({ id: 'o2', status: OrgStatus.SUSPENDED }),
        ],
      });
      // For getAgencyHealthScores call
      organizationDal.find.mockResolvedValueOnce({
        payload: [mockOrg({ id: 'o1', status: OrgStatus.ACTIVE })],
      });

      const result = await service.getPlatformAnalytics();

      expect(result.agencies_by_status[OrgStatus.ACTIVE]).toBe(1);
      expect(result.agencies_by_status[OrgStatus.SUSPENDED]).toBe(1);
    });

    it('should calculate total MRR from active subscriptions', async () => {
      subscriptionDal.find.mockResolvedValue({
        payload: [
          mockSubscription({ mrr_cents: 29900 }),
          mockSubscription({ id: 's2', mrr_cents: 49900 }),
        ],
      });

      const result = await service.getPlatformAnalytics();

      expect(result.total_mrr_cents).toBe(79800);
    });

    it('should group MRR by tier', async () => {
      subscriptionDal.find.mockResolvedValue({
        payload: [
          mockSubscription({ plan_tier: 'basic', mrr_cents: 9900 }),
          mockSubscription({ id: 's2', plan_tier: 'professional', mrr_cents: 29900 }),
          mockSubscription({ id: 's3', plan_tier: 'basic', mrr_cents: 9900 }),
        ],
      });

      const result = await service.getPlatformAnalytics();

      const basicTier = result.mrr_by_tier.find((t) => t.tier === 'basic');
      expect(basicTier?.count).toBe(2);
      expect(basicTier?.mrr_cents).toBe(19800);
    });

    it('should count claims by status platform-wide', async () => {
      claimDal.find.mockResolvedValueOnce({
        payload: [
          mockClaim({ status: ClaimStatus.SUBMITTED }),
          mockClaim({ id: 'c2', status: ClaimStatus.PAID }),
          mockClaim({ id: 'c3', status: ClaimStatus.DENIED }),
        ],
      });
      // For health scores
      claimDal.find.mockResolvedValueOnce({
        payload: [
          mockClaim({ status: ClaimStatus.SUBMITTED }),
          mockClaim({ id: 'c2', status: ClaimStatus.PAID }),
          mockClaim({ id: 'c3', status: ClaimStatus.DENIED }),
        ],
      });

      const result = await service.getPlatformAnalytics();

      expect(result.claims_by_status_platform[ClaimStatus.SUBMITTED]).toBe(1);
      expect(result.claims_by_status_platform[ClaimStatus.PAID]).toBe(1);
    });

    it('should calculate avg claims per agency', async () => {
      claimDal.find.mockResolvedValueOnce({
        payload: [mockClaim(), mockClaim({ id: 'c2' }), mockClaim({ id: 'c3' })],
      });
      claimDal.find.mockResolvedValueOnce({
        payload: [mockClaim(), mockClaim({ id: 'c2' }), mockClaim({ id: 'c3' })],
      });

      const result = await service.getPlatformAnalytics();

      expect(result.avg_claims_per_agency).toBe(3);
    });

    it('should pass pagination limit to DAL calls', async () => {
      await service.getPlatformAnalytics();

      expect(organizationDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { limit: 50000, page: 1 },
        }),
      );
      expect(claimDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { limit: 50000, page: 1 },
        }),
      );
    });
  });

  describe('getAgencyHealthScores', () => {
    it('should return health scores for active orgs', async () => {
      const result = await service.getAgencyHealthScores();

      expect(result).toHaveLength(1);
      expect(result[0].org_id).toBe('org-1');
      expect(result[0].legal_name).toBe('Test Agency');
    });

    it('should classify HEALTHY when success rate > 80%', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ status: ClaimStatus.PAID }),
          mockClaim({ id: 'c2', status: ClaimStatus.PAID }),
        ],
      });

      const result = await service.getAgencyHealthScores();

      expect(result[0].health_score).toBe('HEALTHY');
    });

    it('should classify AT_RISK when 50-80%', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ status: ClaimStatus.PAID }),
          mockClaim({ id: 'c2', status: ClaimStatus.DENIED }),
          mockClaim({ id: 'c3', status: ClaimStatus.DENIED }),
        ],
      });

      const result = await service.getAgencyHealthScores();

      // 1 paid / 3 decided = 33% → CRITICAL
      expect(result[0].health_score).toBe('CRITICAL');
    });

    it('should classify CRITICAL when < 50%', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ status: ClaimStatus.DENIED }),
          mockClaim({ id: 'c2', status: ClaimStatus.DENIED }),
          mockClaim({ id: 'c3', status: ClaimStatus.PAID }),
        ],
      });

      const result = await service.getAgencyHealthScores();

      // 1/3 = 33.33% → CRITICAL
      expect(result[0].health_score).toBe('CRITICAL');
    });

    it('should count active users per org', async () => {
      userDal.find.mockResolvedValue({
        payload: [
          mockUser({ id: 'u1', org_id: 'org-1' }),
          mockUser({ id: 'u2', org_id: 'org-1' }),
        ],
      });

      const result = await service.getAgencyHealthScores();

      expect(result[0].active_users).toBe(2);
    });

    it('should count claims submitted in last 30 days', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ submitted_at: daysAgo(10) }),
          mockClaim({ id: 'c2', submitted_at: daysAgo(45) }),
        ],
      });

      const result = await service.getAgencyHealthScores();

      expect(result[0].claims_submitted_30d).toBe(1);
    });

    it('should default to HEALTHY when no decided claims', async () => {
      claimDal.find.mockResolvedValue({ payload: [] });

      const result = await service.getAgencyHealthScores();

      expect(result[0].claim_success_rate_percent).toBe(100);
      expect(result[0].health_score).toBe('HEALTHY');
    });
  });
});
