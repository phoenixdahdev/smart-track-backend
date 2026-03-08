import { SiteController } from './site.controller';
import { SiteService } from '@services/site.service';

describe('SiteController', () => {
  let controller: SiteController;
  let siteService: {
    list: jest.Mock;
    listByProgram: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
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
    siteService = {
      list: jest.fn().mockResolvedValue({
        payload: [mockSite],
        paginationMeta: { total: 1 },
      }),
      listByProgram: jest.fn().mockResolvedValue({
        payload: [mockSite],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockSite),
      findById: jest.fn().mockResolvedValue(mockSite),
      update: jest.fn().mockResolvedValue(mockSite),
    };

    controller = new SiteController(siteService as unknown as SiteService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/sites', () => {
    it('should list sites', async () => {
      const result = await controller.list('org-uuid', {});
      expect(result.message).toBe('Sites retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /admin/sites/by-program/:programId', () => {
    it('should list sites by program', async () => {
      const result = await controller.listByProgram(
        'prog-uuid',
        'org-uuid',
        {},
      );
      expect(result.message).toBe('Sites retrieved');
      expect(result.data[0].program_id).toBe('prog-uuid');
    });
  });

  describe('POST /admin/sites', () => {
    it('should create site', async () => {
      const result = await controller.create(
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
      expect(result.message).toBe('Site created');
      expect(result.data.id).toBe('site-uuid');
    });
  });

  describe('GET /admin/sites/:id', () => {
    it('should get site by id', async () => {
      const result = await controller.findById('site-uuid', 'org-uuid');
      expect(result.message).toBe('Site retrieved');
      expect(result.data.name).toBe('Sunrise House');
    });
  });

  describe('PATCH /admin/sites/:id', () => {
    it('should update site', async () => {
      const result = await controller.update('site-uuid', 'org-uuid', {
        name: 'East Campus',
      });
      expect(result.message).toBe('Site updated');
    });
  });
});
