import { AdminAdlCategoryController } from './admin-adl-category.controller';

describe('AdminAdlCategoryController', () => {
  let controller: AdminAdlCategoryController;
  let adlCategoryService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
    seedStandardCategories: jest.Mock;
  };

  const mockCategory = {
    id: 'cat-uuid',
    org_id: 'org-uuid',
    name: 'Bathing',
    category_type: 'ADL',
    display_order: 1,
    active: true,
  };

  const mockCurrentUser = {
    id: 'admin-uuid',
    org_id: 'org-uuid',
    role: 'ADMIN',
    email: 'admin@test.com',
    name: 'Admin User',
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

  beforeEach(() => {
    adlCategoryService = {
      create: jest.fn().mockResolvedValue(mockCategory),
      findAll: jest.fn().mockResolvedValue([mockCategory]),
      findById: jest.fn().mockResolvedValue(mockCategory),
      update: jest.fn().mockResolvedValue(mockCategory),
      deactivate: jest.fn().mockResolvedValue({ ...mockCategory, active: false }),
      seedStandardCategories: jest.fn().mockResolvedValue([mockCategory]),
    };

    controller = new AdminAdlCategoryController(adlCategoryService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /admin/adl-categories', () => {
    it('should create a category', async () => {
      const dto = { name: 'Bathing', category_type: 'ADL' };

      const result = await controller.create(
        dto as never,
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('ADL category created');
      expect(result.data).toEqual(mockCategory);
      expect(adlCategoryService.create).toHaveBeenCalledWith(
        dto,
        'org-uuid',
        'admin-uuid',
        'ADMIN',
        '127.0.0.1',
        'jest',
      );
    });
  });

  describe('GET /admin/adl-categories', () => {
    it('should list all categories', async () => {
      const result = await controller.list('org-uuid');

      expect(result.message).toBe('ADL categories retrieved');
      expect(result.data).toEqual([mockCategory]);
      expect(adlCategoryService.findAll).toHaveBeenCalledWith('org-uuid');
    });
  });

  describe('GET /admin/adl-categories/:id', () => {
    it('should get a category by ID', async () => {
      const result = await controller.findById('cat-uuid', 'org-uuid');

      expect(result.message).toBe('ADL category retrieved');
      expect(result.data).toEqual(mockCategory);
      expect(adlCategoryService.findById).toHaveBeenCalledWith('cat-uuid', 'org-uuid');
    });
  });

  describe('PATCH /admin/adl-categories/:id', () => {
    it('should update a category', async () => {
      const dto = { name: 'Updated Bathing' };

      const result = await controller.update(
        'cat-uuid',
        dto as never,
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('ADL category updated');
      expect(adlCategoryService.update).toHaveBeenCalledWith(
        'cat-uuid',
        dto,
        'org-uuid',
        'admin-uuid',
        'ADMIN',
        '127.0.0.1',
        'jest',
      );
    });
  });

  describe('DELETE /admin/adl-categories/:id', () => {
    it('should deactivate a category', async () => {
      const result = await controller.deactivate(
        'cat-uuid',
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('ADL category deactivated');
      expect(adlCategoryService.deactivate).toHaveBeenCalledWith(
        'cat-uuid',
        'org-uuid',
        'admin-uuid',
        'ADMIN',
        '127.0.0.1',
        'jest',
      );
    });
  });

  describe('POST /admin/adl-categories/seed', () => {
    it('should seed standard categories', async () => {
      const result = await controller.seed('org-uuid');

      expect(result.message).toBe('1 standard categories seeded');
      expect(result.data).toEqual([mockCategory]);
      expect(adlCategoryService.seedStandardCategories).toHaveBeenCalledWith('org-uuid');
    });
  });
});
