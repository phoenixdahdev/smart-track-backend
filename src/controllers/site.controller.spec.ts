import { SiteController } from './site.controller';
import { SiteService } from '@services/site.service';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { type Request } from 'express';

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

  const mockCurrentUser = {
    id: 'admin-uuid',
    org_id: 'org-uuid',
    role: AgencyRole.ADMIN,
    email: 'admin@agency.com',
    name: 'Admin',
    sub_permissions: {},
    session_timeout: 30,
    mfa_enabled: false,
    email_verified: true,
  };

  const mockReq = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
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
        mockCurrentUser as unknown as AuthenticatedUser,
        mockReq as unknown as Request,
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
      const result = await controller.update(
        'site-uuid',
        mockCurrentUser as unknown as AuthenticatedUser,
        { name: 'East Campus' },
        mockReq as unknown as Request,
      );
      expect(result.message).toBe('Site updated');
    });
  });
});
