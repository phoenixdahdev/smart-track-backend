import { NotFoundException } from '@nestjs/common';
import { SiteService } from './site.service';

describe('SiteService', () => {
  let service: SiteService;
  let siteDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  const mockSite = {
    id: 'site-uuid',
    org_id: 'org-uuid',
    program_id: 'prog-uuid',
    name: 'Sunrise House',
    address_line1: '123 Oak St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    active: true,
  };

  beforeEach(() => {
    siteDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockSite],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockSite),
      update: jest.fn().mockResolvedValue(mockSite),
    };

    service = new SiteService(siteDal as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    it('should return sites for org', async () => {
      const result = await service.list('org-uuid');
      expect(siteDal.find).toHaveBeenCalledWith(
        expect.objectContaining({ findOptions: { org_id: 'org-uuid' } }),
      );
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('listByProgram', () => {
    it('should filter by program_id and org_id', async () => {
      await service.listByProgram('prog-uuid', 'org-uuid');
      expect(siteDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: { program_id: 'prog-uuid', org_id: 'org-uuid' },
        }),
      );
    });
  });

  describe('create', () => {
    it('should create site with org_id', async () => {
      const result = await service.create(
        {
          program_id: 'prog-uuid',
          name: 'Sunrise House',
          address_line1: '123 Oak St',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
        },
        'org-uuid',
      );

      expect(siteDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            program_id: 'prog-uuid',
            name: 'Sunrise House',
          }) as unknown,
        }),
      );
      expect(result.id).toBe('site-uuid');
    });
  });

  describe('findById', () => {
    it('should return site when found', async () => {
      siteDal.get.mockResolvedValue(mockSite);

      const result = await service.findById('site-uuid', 'org-uuid');
      expect(result.name).toBe('Sunrise House');
    });

    it('should throw NotFoundException when not found', async () => {
      siteDal.get.mockResolvedValue(null);

      await expect(service.findById('bad-id', 'org-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update site', async () => {
      siteDal.get.mockResolvedValue(mockSite);

      await service.update('site-uuid', 'org-uuid', { name: 'New Name' });

      expect(siteDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: { name: 'New Name' },
        }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      siteDal.get.mockResolvedValue(null);

      await expect(
        service.update('bad-id', 'org-uuid', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
