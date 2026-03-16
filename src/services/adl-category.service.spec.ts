import { NotFoundException } from '@nestjs/common';
import { AdlCategoryService } from './adl-category.service';

describe('AdlCategoryService', () => {
  let service: AdlCategoryService;
  let adlCategoryDal: {
    get: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockCategory = {
    id: 'cat-uuid',
    org_id: 'org-uuid',
    name: 'Bathing',
    description: null,
    category_type: 'ADL',
    display_order: 1,
    is_standard: false,
    active: true,
  };

  beforeEach(() => {
    adlCategoryDal = {
      get: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue({
        payload: [mockCategory],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockCategory),
      update: jest.fn().mockResolvedValue(mockCategory),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new AdlCategoryService(
      adlCategoryDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category and log audit action', async () => {
      const dto = { name: 'Bathing', category_type: 'ADL' };

      const result = await service.create(
        dto as never,
        'org-uuid',
        'user-uuid',
        'ADMIN',
        '127.0.0.1',
        'jest',
      );

      expect(result).toEqual(mockCategory);
      expect(adlCategoryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            name: 'Bathing',
            category_type: 'ADL',
            is_standard: false,
            active: true,
          }) as unknown,
        }),
      );
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ADL_CATEGORY_CREATED' }),
      );
    });

    it('should default display_order to 0 and description to null', async () => {
      const dto = { name: 'Grooming', category_type: 'ADL' };

      await service.create(
        dto as never,
        'org-uuid',
        'user-uuid',
        'ADMIN',
        '127.0.0.1',
        'jest',
      );

      expect(adlCategoryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            display_order: 0,
            description: null,
          }) as unknown,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return active categories for the org', async () => {
      const result = await service.findAll('org-uuid');

      expect(result).toEqual([mockCategory]);
      expect(adlCategoryDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            org_id: 'org-uuid',
            active: true,
          }) as unknown,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a category when found', async () => {
      adlCategoryDal.get.mockResolvedValue(mockCategory);

      const result = await service.findById('cat-uuid', 'org-uuid');

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when not found', async () => {
      adlCategoryDal.get.mockResolvedValue(null);

      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a category and log audit action', async () => {
      adlCategoryDal.get.mockResolvedValue(mockCategory);

      const dto = { name: 'Bathing Updated', display_order: 2 };

      const result = await service.update(
        'cat-uuid',
        dto as never,
        'org-uuid',
        'user-uuid',
        'ADMIN',
        '127.0.0.1',
        'jest',
      );

      expect(result).toEqual(mockCategory);
      expect(adlCategoryDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: 'cat-uuid' },
          updatePayload: expect.objectContaining({
            name: 'Bathing Updated',
            display_order: 2,
          }) as unknown,
        }),
      );
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ADL_CATEGORY_UPDATED' }),
      );
    });

    it('should throw NotFoundException when category not found', async () => {
      adlCategoryDal.get.mockResolvedValue(null);

      await expect(
        service.update(
          'bad-id',
          { name: 'test' } as never,
          'org-uuid',
          'user-uuid',
          'ADMIN',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only include defined fields in update payload', async () => {
      adlCategoryDal.get.mockResolvedValue(mockCategory);

      await service.update(
        'cat-uuid',
        { name: 'New Name' } as never,
        'org-uuid',
        'user-uuid',
        'ADMIN',
        '127.0.0.1',
        'jest',
      );

      expect(adlCategoryDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: { name: 'New Name' },
        }),
      );
    });
  });

  describe('deactivate', () => {
    it('should set active to false and log audit action', async () => {
      adlCategoryDal.get.mockResolvedValue(mockCategory);

      await service.deactivate(
        'cat-uuid',
        'org-uuid',
        'user-uuid',
        'ADMIN',
        '127.0.0.1',
        'jest',
      );

      expect(adlCategoryDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: { active: false },
        }),
      );
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ADL_CATEGORY_DEACTIVATED' }),
      );
    });

    it('should throw NotFoundException when category not found', async () => {
      adlCategoryDal.get.mockResolvedValue(null);

      await expect(
        service.deactivate(
          'bad-id',
          'org-uuid',
          'user-uuid',
          'ADMIN',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('seedStandardCategories', () => {
    it('should create standard categories that do not already exist', async () => {
      adlCategoryDal.get.mockResolvedValue(null);
      adlCategoryDal.create.mockResolvedValue(mockCategory);

      const result = await service.seedStandardCategories('org-uuid');

      expect(result.length).toBe(15);
      expect(adlCategoryDal.create).toHaveBeenCalledTimes(15);
      expect(adlCategoryDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            is_standard: true,
          }) as unknown,
        }),
      );
    });

    it('should skip categories that already exist', async () => {
      adlCategoryDal.get.mockResolvedValue(mockCategory);

      const result = await service.seedStandardCategories('org-uuid');

      expect(result.length).toBe(0);
      expect(adlCategoryDal.create).not.toHaveBeenCalled();
    });
  });
});
