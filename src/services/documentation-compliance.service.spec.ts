import { DocumentationComplianceService } from './documentation-compliance.service';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';

describe('DocumentationComplianceService', () => {
  let service: DocumentationComplianceService;
  let serviceRecordDal: { find: jest.Mock };
  let dailyNoteDal: { find: jest.Mock };

  const now = new Date();
  const hoursAgo = (n: number) => {
    const d = new Date(now);
    d.setHours(d.getHours() - n);
    return d;
  };

  const mockRecord = (overrides: Record<string, unknown> = {}) => ({
    id: 'sr-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    program_id: 'prog-uuid',
    service_date: '2026-03-15',
    status: ServiceRecordStatus.APPROVED,
    submitted_at: hoursAgo(48),
    approved_at: hoursAgo(24),
    ...overrides,
  });

  beforeEach(() => {
    serviceRecordDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockRecord()] }),
    };
    dailyNoteDal = {
      find: jest.fn().mockResolvedValue({
        payload: [{ service_record_id: 'sr-uuid' }],
      }),
    };

    service = new DocumentationComplianceService(
      serviceRecordDal as never,
      dailyNoteDal as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getComplianceReport', () => {
    it('should count records by status', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [
          mockRecord({ id: 'r1', status: ServiceRecordStatus.APPROVED }),
          mockRecord({ id: 'r2', status: ServiceRecordStatus.REJECTED }),
          mockRecord({ id: 'r3', status: ServiceRecordStatus.DRAFT }),
        ],
      });

      const result = await service.getComplianceReport('org-uuid');

      expect(result.total_records).toBe(3);
      expect(result.by_status.length).toBeGreaterThanOrEqual(2);
    });

    it('should calculate approval and rejection rates', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [
          mockRecord({ id: 'r1', status: ServiceRecordStatus.APPROVED }),
          mockRecord({ id: 'r2', status: ServiceRecordStatus.APPROVED }),
          mockRecord({ id: 'r3', status: ServiceRecordStatus.REJECTED }),
        ],
      });

      const result = await service.getComplianceReport('org-uuid');

      expect(result.approval_rate_percent).toBeCloseTo(66.67, 1);
      expect(result.rejection_rate_percent).toBeCloseTo(33.33, 1);
    });

    it('should calculate avg hours to review', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [
          mockRecord({ submitted_at: hoursAgo(48), approved_at: hoursAgo(24) }),
        ],
      });

      const result = await service.getComplianceReport('org-uuid');

      expect(result.avg_hours_to_review).toBeCloseTo(24, 0);
    });

    it('should track documentation completeness', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [
          mockRecord({ id: 'r1' }),
          mockRecord({ id: 'r2' }),
        ],
      });
      dailyNoteDal.find.mockResolvedValue({
        payload: [{ service_record_id: 'r1' }],
      });

      const result = await service.getComplianceReport('org-uuid');

      expect(result.records_with_daily_notes).toBe(1);
      expect(result.records_without_daily_notes).toBe(1);
      expect(result.documentation_completeness_percent).toBe(50);
    });

    it('should filter by date range', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [
          mockRecord({ id: 'r1', service_date: '2026-01-01' }),
          mockRecord({ id: 'r2', service_date: '2026-03-15' }),
        ],
      });

      const result = await service.getComplianceReport('org-uuid', {
        date_from: '2026-03-01',
      });

      expect(result.total_records).toBe(1);
    });

    it('should apply staff_id filter to DAL', async () => {
      await service.getComplianceReport('org-uuid', { staff_id: 'staff-uuid' });

      expect(serviceRecordDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ staff_id: 'staff-uuid' }) as unknown,
        }),
      );
    });

    it('should apply program_id filter to DAL', async () => {
      await service.getComplianceReport('org-uuid', { program_id: 'prog-uuid' });

      expect(serviceRecordDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ program_id: 'prog-uuid' }) as unknown,
        }),
      );
    });

    it('should pass pagination limit to DAL calls', async () => {
      await service.getComplianceReport('org-uuid');

      expect(serviceRecordDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { limit: 50000, page: 1 },
        }),
      );
      expect(dailyNoteDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paginationPayload: { limit: 50000, page: 1 },
        }),
      );
    });

    it('should return zeros when no records', async () => {
      serviceRecordDal.find.mockResolvedValue({ payload: [] });
      dailyNoteDal.find.mockResolvedValue({ payload: [] });

      const result = await service.getComplianceReport('org-uuid');

      expect(result.total_records).toBe(0);
      expect(result.approval_rate_percent).toBe(0);
      expect(result.rejection_rate_percent).toBe(0);
      expect(result.avg_hours_to_review).toBe(0);
      expect(result.documentation_completeness_percent).toBe(0);
    });

    it('should handle PENDING_REVIEW records not affecting approval rate', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [
          mockRecord({ id: 'r1', status: ServiceRecordStatus.PENDING_REVIEW }),
          mockRecord({ id: 'r2', status: ServiceRecordStatus.APPROVED }),
        ],
      });

      const result = await service.getComplianceReport('org-uuid');

      expect(result.total_records).toBe(2);
      expect(result.approval_rate_percent).toBe(100);
    });

    it('should handle date_to filter', async () => {
      serviceRecordDal.find.mockResolvedValue({
        payload: [
          mockRecord({ id: 'r1', service_date: '2026-03-15' }),
          mockRecord({ id: 'r2', service_date: '2026-04-01' }),
        ],
      });

      const result = await service.getComplianceReport('org-uuid', {
        date_to: '2026-03-31',
      });

      expect(result.total_records).toBe(1);
    });
  });
});
