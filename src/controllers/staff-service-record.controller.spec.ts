import { StaffServiceRecordController } from './staff-service-record.controller';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';

describe('StaffServiceRecordController', () => {
  let controller: StaffServiceRecordController;
  let serviceRecordService: {
    create: jest.Mock;
    listByStaff: jest.Mock;
    findByIdForStaff: jest.Mock;
    update: jest.Mock;
    submitForReview: jest.Mock;
  };

  const mockRecord = {
    id: 'sr-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    status: ServiceRecordStatus.DRAFT,
  };

  const mockCurrentUser = {
    id: 'staff-uuid',
    org_id: 'org-uuid',
    role: 'DSP',
    email: 'dsp@test.com',
    name: 'DSP User',
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

  beforeEach(() => {
    serviceRecordService = {
      create: jest.fn().mockResolvedValue(mockRecord),
      listByStaff: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      findByIdForStaff: jest.fn().mockResolvedValue(mockRecord),
      update: jest.fn().mockResolvedValue(mockRecord),
      submitForReview: jest.fn().mockResolvedValue({
        ...mockRecord,
        status: ServiceRecordStatus.PENDING_REVIEW,
      }),
    };

    controller = new StaffServiceRecordController(
      serviceRecordService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /staff/service-records', () => {
    it('should create a service record', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        service_date: '2026-03-10',
        units_delivered: 4,
      };

      const result = await controller.create(
        dto,
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('Service record created');
      expect(serviceRecordService.create).toHaveBeenCalledWith(
        dto,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );
    });
  });

  describe('GET /staff/service-records', () => {
    it('should list staff service records', async () => {
      const result = await controller.list(
        mockCurrentUser as never,
        {} as never,
      );

      expect(result.message).toBe('Service records retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /staff/service-records/:id', () => {
    it('should get a service record by ID', async () => {
      const result = await controller.findById(
        'sr-uuid',
        mockCurrentUser as never,
      );

      expect(result.message).toBe('Service record retrieved');
      expect(serviceRecordService.findByIdForStaff).toHaveBeenCalledWith(
        'sr-uuid',
        'org-uuid',
        'staff-uuid',
      );
    });
  });

  describe('PATCH /staff/service-records/:id/submit', () => {
    it('should submit for review', async () => {
      const result = await controller.submitForReview(
        'sr-uuid',
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('Service record submitted for review');
    });
  });
});
