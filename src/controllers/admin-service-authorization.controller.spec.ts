import { AdminServiceAuthorizationController } from './admin-service-authorization.controller';

describe('AdminServiceAuthorizationController', () => {
  let controller: AdminServiceAuthorizationController;
  let serviceAuthorizationService: {
    list: jest.Mock;
    findById: jest.Mock;
    listByIndividual: jest.Mock;
  };

  const mockRecord = {
    id: 'sa-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    auth_number: 'AUTH-001',
    units_authorized: 100,
    status: 'ACTIVE',
  };

  beforeEach(() => {
    serviceAuthorizationService = {
      list: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockRecord),
      listByIndividual: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
    };

    controller = new AdminServiceAuthorizationController(
      serviceAuthorizationService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/service-authorizations', () => {
    it('should list all service authorizations', async () => {
      const result = await controller.list('org-uuid', {} as never);

      expect(result.message).toBe('Service authorizations retrieved');
      expect(result.data).toHaveLength(1);
      expect(serviceAuthorizationService.list).toHaveBeenCalledWith(
        'org-uuid', {},
      );
    });
  });

  describe('GET /admin/service-authorizations/:id', () => {
    it('should get service authorization by id', async () => {
      const result = await controller.findById('sa-uuid', 'org-uuid');

      expect(result.message).toBe('Service authorization retrieved');
      expect(result.data.id).toBe('sa-uuid');
    });
  });

  describe('GET /admin/service-authorizations/by-individual/:individualId', () => {
    it('should list authorizations by individual', async () => {
      const result = await controller.listByIndividual(
        'ind-uuid', 'org-uuid', {} as never,
      );

      expect(result.message).toBe('Service authorizations retrieved');
      expect(result.data).toHaveLength(1);
      expect(serviceAuthorizationService.listByIndividual).toHaveBeenCalledWith(
        'ind-uuid', 'org-uuid', {},
      );
    });
  });
});
