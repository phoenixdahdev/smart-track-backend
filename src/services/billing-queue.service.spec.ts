import { BillingQueueService } from './billing-queue.service';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';
import { ClaimStatus } from '@enums/claim-status.enum';

describe('BillingQueueService', () => {
  let service: BillingQueueService;
  let serviceRecordDal: { find: jest.Mock; get: jest.Mock };
  let claimDal: { find: jest.Mock };
  let coverageDal: { find: jest.Mock };
  let serviceAuthorizationDal: { find: jest.Mock };
  let serviceCodeDal: { get: jest.Mock };

  const mockServiceRecord = {
    id: 'sr-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    staff_id: 'staff-uuid',
    program_id: 'prog-uuid',
    service_date: '2026-03-10',
    service_code_id: 'sc-uuid',
    status: ServiceRecordStatus.APPROVED,
  };

  const mockServiceRecord2 = {
    ...mockServiceRecord,
    id: 'sr-uuid-2',
    individual_id: 'ind-uuid-2',
    program_id: 'prog-uuid-2',
    service_date: '2026-03-05',
  };

  const mockCoverage = {
    id: 'cov-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    payer_config_id: 'pc-uuid',
    coverage_start: '2026-01-01',
    coverage_end: '2026-12-31',
    priority: 1,
    active: true,
  };

  const mockAuth = {
    id: 'sa-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    service_code_id: 'sc-uuid',
    auth_number: 'AUTH-001',
    units_authorized: 100,
    units_used: 40,
    units_pending: 10,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
  };

  beforeEach(() => {
    serviceRecordDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockServiceRecord],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(mockServiceRecord),
    };
    claimDal = {
      find: jest.fn().mockResolvedValue({ payload: [] }),
    };
    coverageDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockCoverage],
      }),
    };
    serviceAuthorizationDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockAuth],
      }),
    };
    serviceCodeDal = {
      get: jest.fn().mockResolvedValue({ id: 'sc-uuid', code: 'H2015' }),
    };

    service = new BillingQueueService(
      serviceRecordDal as never,
      claimDal as never,
      coverageDal as never,
      serviceAuthorizationDal as never,
      serviceCodeDal as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQueue', () => {
    it('should return empty queue when no approved records', async () => {
      serviceRecordDal.find.mockResolvedValue({ payload: [], paginationMeta: { total: 0 } });

      const result = await service.getQueue('org-uuid');

      expect(result.payload).toHaveLength(0);
      expect(result.paginationMeta.total).toBe(0);
    });

    it('should return approved records without active claims', async () => {
      const result = await service.getQueue('org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0].id).toBe('sr-uuid');
    });

    it('should exclude records that have active claims', async () => {
      claimDal.find.mockResolvedValue({
        payload: [{ id: 'claim-uuid', status: ClaimStatus.SUBMITTED }],
      });

      const result = await service.getQueue('org-uuid');

      expect(result.payload).toHaveLength(0);
    });

    it('should include records whose claims are in terminal status', async () => {
      claimDal.find.mockResolvedValue({
        payload: [{ id: 'claim-uuid', status: ClaimStatus.VOID }],
      });

      const result = await service.getQueue('org-uuid');

      expect(result.payload).toHaveLength(1);
    });

    it('should filter by date_from', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [mockServiceRecord, mockServiceRecord2],
        paginationMeta: { total: 2 },
      });

      const result = await service.getQueue('org-uuid', undefined, {
        date_from: '2026-03-08',
      });

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0].id).toBe('sr-uuid');
    });

    it('should filter by date_to', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [mockServiceRecord, mockServiceRecord2],
        paginationMeta: { total: 2 },
      });

      const result = await service.getQueue('org-uuid', undefined, {
        date_to: '2026-03-07',
      });

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0].id).toBe('sr-uuid-2');
    });

    it('should filter by individual_id', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [mockServiceRecord, mockServiceRecord2],
        paginationMeta: { total: 2 },
      });

      const result = await service.getQueue('org-uuid', undefined, {
        individual_id: 'ind-uuid',
      });

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0].individual_id).toBe('ind-uuid');
    });

    it('should filter by program_id', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [mockServiceRecord, mockServiceRecord2],
        paginationMeta: { total: 2 },
      });

      const result = await service.getQueue('org-uuid', undefined, {
        program_id: 'prog-uuid',
      });

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0].program_id).toBe('prog-uuid');
    });

    it('should paginate results', async () => {
      const records = Array.from({ length: 5 }, (_, i) => ({
        ...mockServiceRecord,
        id: `sr-uuid-${i}`,
      }));
      serviceRecordDal.find.mockResolvedValue({
        payload: records,
        paginationMeta: { total: 5 },
      });

      const result = await service.getQueue(
        'org-uuid',
        { page: '2', limit: '2' } as never,
      );

      expect(result.payload).toHaveLength(2);
      expect(result.paginationMeta.page).toBe(2);
      expect(result.paginationMeta.total).toBe(5);
      expect(result.paginationMeta.has_previous).toBe(true);
    });
  });

  describe('enrichQueueItem', () => {
    it('should return null when service record not found', async () => {
      serviceRecordDal.get.mockResolvedValue(null);

      const result = await service.enrichQueueItem('bad-id', 'org-uuid');
      expect(result).toBeNull();
    });

    it('should return enriched data with coverage', async () => {
      const result = await service.enrichQueueItem('sr-uuid', 'org-uuid');

      expect(result).toBeDefined();
      expect(result!.service_record.id).toBe('sr-uuid');
      expect(result!.coverages).toHaveLength(1);
      expect(result!.flags).not.toContain('NO_PAYER_COVERAGE');
    });

    it('should flag NO_PAYER_COVERAGE when no coverage matches date', async () => {
      coverageDal.find.mockResolvedValue({
        payload: [{ ...mockCoverage, coverage_start: '2099-01-01', coverage_end: '2099-12-31' }],
      });

      const result = await service.enrichQueueItem('sr-uuid', 'org-uuid');

      expect(result!.flags).toContain('NO_PAYER_COVERAGE');
    });

    it('should return authorization info when matching auth found', async () => {
      const result = await service.enrichQueueItem('sr-uuid', 'org-uuid');

      expect(result!.authorization).toBeDefined();
      expect(result!.authorization!.auth_number).toBe('AUTH-001');
      expect(result!.authorization!.units_remaining).toBe(50);
    });

    it('should flag NO_AUTHORIZATION when no matching auth found', async () => {
      serviceAuthorizationDal.find.mockResolvedValue({ payload: [] });

      const result = await service.enrichQueueItem('sr-uuid', 'org-uuid');

      expect(result!.authorization).toBeNull();
      expect(result!.flags).toContain('NO_AUTHORIZATION');
    });

    it('should flag NO_SERVICE_CODE when record has no service_code_id', async () => {
      serviceRecordDal.get.mockResolvedValue({
        ...mockServiceRecord,
        service_code_id: null,
      });

      const result = await service.enrichQueueItem('sr-uuid', 'org-uuid');

      expect(result!.flags).toContain('NO_SERVICE_CODE');
    });
  });
});
