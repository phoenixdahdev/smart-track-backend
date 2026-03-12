import { AdminServiceRecordController } from './admin-service-record.controller';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';

describe('AdminServiceRecordController', () => {
  let controller: AdminServiceRecordController;
  let serviceRecordService: {
    listAll: jest.Mock;
    listByIndividual: jest.Mock;
    listByStaff: jest.Mock;
    findById: jest.Mock;
  };

  const mockRecord = {
    id: 'sr-uuid',
    org_id: 'org-uuid',
    status: ServiceRecordStatus.DRAFT,
  };

  const mockCurrentUser = {
    id: 'admin-uuid',
    org_id: 'org-uuid',
    role: 'ADMIN',
    email: 'admin@test.com',
    name: 'Admin User',
    sub_permissions: {},
    session_timeout: 1800,
    mfa_enabled: false,
    email_verified: true,
  };

  beforeEach(() => {
    serviceRecordService = {
      listAll: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      listByIndividual: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      listByStaff: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockRecord),
    };

    controller = new AdminServiceRecordController(
      serviceRecordService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/service-records', () => {
    it('should list all service records', async () => {
      const result = await controller.list(
        mockCurrentUser as never,
        {} as never,
      );

      expect(result.message).toBe('Service records retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /admin/service-records/by-individual/:id', () => {
    it('should list records by individual', async () => {
      const result = await controller.listByIndividual(
        'ind-uuid',
        'org-uuid',
        {} as never,
      );

      expect(result.data).toHaveLength(1);
      expect(serviceRecordService.listByIndividual).toHaveBeenCalledWith(
        'ind-uuid',
        'org-uuid',
        expect.anything(),
      );
    });
  });

  describe('GET /admin/service-records/:id', () => {
    it('should get a single record', async () => {
      const result = await controller.findById('sr-uuid', 'org-uuid');

      expect(result.message).toBe('Service record retrieved');
      expect(serviceRecordService.findById).toHaveBeenCalledWith(
        'sr-uuid',
        'org-uuid',
      );
    });
  });
});
