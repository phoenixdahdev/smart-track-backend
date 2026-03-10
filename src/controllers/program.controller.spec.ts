import { ProgramController } from './program.controller';
import { ProgramService } from '@services/program.service';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { type Request } from 'express';

describe('ProgramController', () => {
  let controller: ProgramController;
  let programService: {
    list: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };

  const mockProgram = {
    id: 'prog-uuid',
    org_id: 'org-uuid',
    name: 'Residential Support',
    type: 'RESIDENTIAL',
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
    programService = {
      list: jest.fn().mockResolvedValue({
        payload: [mockProgram],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockProgram),
      findById: jest.fn().mockResolvedValue(mockProgram),
      update: jest.fn().mockResolvedValue(mockProgram),
    };

    controller = new ProgramController(
      programService as unknown as ProgramService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/programs', () => {
    it('should list programs', async () => {
      const result = await controller.list('org-uuid', {});
      expect(result.message).toBe('Programs retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('POST /admin/programs', () => {
    it('should create program', async () => {
      const result = await controller.create(
        { name: 'Residential Support' },
        mockCurrentUser as unknown as AuthenticatedUser,
        mockReq as unknown as Request,
      );
      expect(result.message).toBe('Program created');
      expect(result.data.id).toBe('prog-uuid');
    });
  });

  describe('GET /admin/programs/:id', () => {
    it('should get program by id', async () => {
      const result = await controller.findById('prog-uuid', 'org-uuid');
      expect(result.message).toBe('Program retrieved');
      expect(result.data.name).toBe('Residential Support');
    });
  });

  describe('PATCH /admin/programs/:id', () => {
    it('should update program', async () => {
      const result = await controller.update(
        'prog-uuid',
        mockCurrentUser as unknown as AuthenticatedUser,
        { name: 'Community Living' },
        mockReq as unknown as Request,
      );
      expect(result.message).toBe('Program updated');
    });
  });
});
