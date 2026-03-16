import { ArReportService } from './ar-report.service';
import { ClaimStatus } from '@enums/claim-status.enum';
import { RemittanceStatus } from '@enums/remittance-status.enum';

describe('ArReportService', () => {
  let service: ArReportService;
  let claimDal: { find: jest.Mock };
  let remittanceDal: { find: jest.Mock };
  let paymentPostDal: { find: jest.Mock };
  let adjustmentDal: { find: jest.Mock };

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
    contractual_adj_cents: 0,
    patient_responsibility_cents: 0,
    balance_cents: 10000,
    status: ClaimStatus.SUBMITTED,
    submitted_at: daysAgo(15),
    paid_at: null,
    created_at: daysAgo(15),
    service_date_from: '2026-03-01',
    ...overrides,
  });

  const mockRemittance = {
    id: 'rem-uuid',
    org_id: 'org-uuid',
    payer_config_id: 'pc-uuid',
    payment_date: '2026-03-15',
    eft_trace_number: 'EFT-001',
    eft_total_cents: 20000,
    status: RemittanceStatus.FULLY_POSTED,
  };

  beforeEach(() => {
    claimDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockClaim()],
      }),
    };
    remittanceDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockRemittance],
      }),
    };
    paymentPostDal = {
      find: jest.fn().mockResolvedValue({
        payload: [{ paid_cents: 18000 }],
      }),
    };
    adjustmentDal = {
      find: jest.fn().mockResolvedValue({ payload: [] }),
    };

    service = new ArReportService(
      claimDal as never,
      remittanceDal as never,
      paymentPostDal as never,
      adjustmentDal as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getArAgingReport', () => {
    it('should bucket claims by days outstanding', async () => {
      const result = await service.getArAgingReport('org-uuid');

      expect(result.buckets).toHaveLength(5);
      expect(result.total_claims).toBe(1);
      expect(result.total_outstanding_cents).toBe(10000);
      // 15 days old → 0-30 bucket
      expect(result.buckets[0].count).toBe(1);
    });

    it('should exclude VOID and DRAFT claims', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ status: ClaimStatus.VOID }),
          mockClaim({ status: ClaimStatus.DRAFT }),
        ],
      });

      const result = await service.getArAgingReport('org-uuid');

      expect(result.total_claims).toBe(0);
    });

    it('should exclude claims with zero balance', async () => {
      claimDal.find.mockResolvedValue({
        payload: [mockClaim({ balance_cents: 0 })],
      });

      const result = await service.getArAgingReport('org-uuid');

      expect(result.total_claims).toBe(0);
    });

    it('should put 45-day-old claim in 31-60 bucket', async () => {
      claimDal.find.mockResolvedValue({
        payload: [mockClaim({ submitted_at: daysAgo(45) })],
      });

      const result = await service.getArAgingReport('org-uuid');

      expect(result.buckets[1].count).toBe(1);
    });

    it('should put 95-day-old claim in 91-120 bucket', async () => {
      claimDal.find.mockResolvedValue({
        payload: [mockClaim({ submitted_at: daysAgo(95) })],
      });

      const result = await service.getArAgingReport('org-uuid');

      expect(result.buckets[3].count).toBe(1);
    });

    it('should put 150-day-old claim in 120+ bucket', async () => {
      claimDal.find.mockResolvedValue({
        payload: [mockClaim({ submitted_at: daysAgo(150) })],
      });

      const result = await service.getArAgingReport('org-uuid');

      expect(result.buckets[4].count).toBe(1);
    });

    it('should apply payer_config_id filter', async () => {
      await service.getArAgingReport('org-uuid', { payer_config_id: 'pc-uuid' });

      expect(claimDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            payer_config_id: 'pc-uuid',
          }) as unknown,
        }),
      );
    });

    it('should apply individual_id filter', async () => {
      await service.getArAgingReport('org-uuid', { individual_id: 'ind-uuid' });

      expect(claimDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            individual_id: 'ind-uuid',
          }) as unknown,
        }),
      );
    });
  });

  describe('getEftReconciliation', () => {
    it('should calculate EFT variance', async () => {
      const result = await service.getEftReconciliation('org-uuid');

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].eft_total_cents).toBe(20000);
      expect(result.rows[0].posted_total_cents).toBe(18000);
      expect(result.rows[0].variance_cents).toBe(2000);
      expect(result.total_variance_cents).toBe(2000);
    });

    it('should filter by date range', async () => {
      const result = await service.getEftReconciliation('org-uuid', {
        date_from: '2026-03-16',
      });

      // mockRemittance payment_date is 2026-03-15, which is before date_from
      expect(result.rows).toHaveLength(0);
    });

    it('should apply payer_config_id filter', async () => {
      await service.getEftReconciliation('org-uuid', { payer_config_id: 'pc-uuid' });

      expect(remittanceDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            payer_config_id: 'pc-uuid',
          }) as unknown,
        }),
      );
    });
  });

  describe('getFinancialDashboard', () => {
    it('should return financial summary', async () => {
      const result = await service.getFinancialDashboard('org-uuid');

      expect(result.total_billed_cents).toBe(10000);
      expect(result.total_paid_cents).toBe(0);
      expect(result.total_outstanding_cents).toBe(10000);
    });

    it('should calculate collection rate', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({
            total_charge_cents: 10000,
            paid_amount_cents: 8000,
            balance_cents: 2000,
            status: ClaimStatus.PAID,
            submitted_at: daysAgo(30),
            paid_at: daysAgo(15),
          }),
        ],
      });

      const result = await service.getFinancialDashboard('org-uuid');

      expect(result.collection_rate_percent).toBe(80);
      expect(result.avg_days_to_payment).toBe(15);
    });

    it('should exclude VOID and DRAFT claims', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ status: ClaimStatus.VOID, total_charge_cents: 50000 }),
          mockClaim({ status: ClaimStatus.SUBMITTED }),
        ],
      });

      const result = await service.getFinancialDashboard('org-uuid');

      expect(result.total_billed_cents).toBe(10000);
    });
  });

  describe('getPayerPerformance', () => {
    it('should return per-payer stats', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ status: ClaimStatus.PAID, paid_amount_cents: 8000 }),
          mockClaim({ id: 'c2', status: ClaimStatus.DENIED }),
          mockClaim({ id: 'c3', status: ClaimStatus.SUBMITTED }),
        ],
      });

      const result = await service.getPayerPerformance('org-uuid');

      expect(result.payers).toHaveLength(1);
      const payer = result.payers[0];
      expect(payer.payer_config_id).toBe('pc-uuid');
      expect(payer.submitted_count).toBe(3);
      expect(payer.paid_count).toBe(1);
      expect(payer.denied_count).toBe(1);
      expect(payer.denial_rate_percent).toBeCloseTo(33.33, 1);
    });

    it('should group by payer_config_id', async () => {
      claimDal.find.mockResolvedValue({
        payload: [
          mockClaim({ payer_config_id: 'pc-1', status: ClaimStatus.PAID, paid_amount_cents: 5000 }),
          mockClaim({ payer_config_id: 'pc-2', status: ClaimStatus.DENIED }),
        ],
      });

      const result = await service.getPayerPerformance('org-uuid');

      expect(result.payers).toHaveLength(2);
    });
  });
});
