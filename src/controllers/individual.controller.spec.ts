import { IndividualController } from './individual.controller';
import { IndividualService } from '@services/individual.service';
import { AgencyRole } from '@enums/role.enum';

describe('IndividualController', () => {
  let controller: IndividualController;
  let individualService: {
    list: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };

  const mockIndividual = {
    id: 'ind-uuid',
    org_id: 'org-uuid',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-05-15',
    active: true,
  };

  const mockCurrentUser = {
    id: 'admin-uuid',
    org_id: 'org-uuid',
    role: AgencyRole.ADMIN,
    email: 'admin@agency.com',
    name: 'Admin User',
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
    individualService = {
      list: jest.fn().mockResolvedValue({
        payload: [mockIndividual],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockIndividual),
      findById: jest.fn().mockResolvedValue(mockIndividual),
      update: jest.fn().mockResolvedValue(mockIndividual),
    };

    controller = new IndividualController(
      individualService as unknown as IndividualService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/individuals', () => {
    it('should list individuals', async () => {
      const result = await controller.list('org-uuid', {});
      expect(result.message).toBe('Individuals retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('POST /admin/individuals', () => {
    it('should create individual', async () => {
      const result = await controller.create(
        {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-05-15',
        },
        mockCurrentUser as never,
        mockReq as never,
      );
      expect(result.message).toBe('Individual created');
      expect(result.data.id).toBe('ind-uuid');
    });
  });

  describe('GET /admin/individuals/:id', () => {
    it('should get individual by id', async () => {
      const result = await controller.findById(
        'ind-uuid',
        mockCurrentUser as never,
        mockReq as never,
      );
      expect(result.message).toBe('Individual retrieved');
      expect(result.data.first_name).toBe('John');
    });
  });

  describe('PATCH /admin/individuals/:id', () => {
    it('should update individual', async () => {
      const result = await controller.update(
        'ind-uuid',
        mockCurrentUser as never,
        { first_name: 'Johnny' },
        mockReq as never,
      );
      expect(result.message).toBe('Individual updated');
    });
  });
});
