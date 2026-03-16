import { UserController } from './user.controller';
import { UserService } from '@services/user.service';
import { AgencyRole } from '@enums/role.enum';
import { UserStatus } from '@enums/user-status.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { type Request } from 'express';

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    list: jest.Mock;
    invite: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    assignRole: jest.Mock;
    updateSubPermissions: jest.Mock;
    deactivate: jest.Mock;
  };

  const mockUser = {
    id: 'user-uuid',
    org_id: 'org-uuid',
    name: 'Jane Smith',
    email: 'jane@agency.com',
    role: AgencyRole.DSP,
    status: UserStatus.ACTIVE,
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
    userService = {
      list: jest.fn().mockResolvedValue({ payload: [mockUser], paginationMeta: { total: 1 } }),
      invite: jest.fn().mockResolvedValue(mockUser),
      findById: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
      assignRole: jest.fn().mockResolvedValue(mockUser),
      updateSubPermissions: jest.fn().mockResolvedValue(mockUser),
      deactivate: jest.fn().mockResolvedValue(undefined),
    };

    controller = new UserController(userService as unknown as UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/users', () => {
    it('should list users', async () => {
      const result = await controller.list('org-uuid', {});
      expect(result.message).toBe('Users retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('POST /admin/users', () => {
    it('should invite user', async () => {
      const result = await controller.invite(
        { name: 'Jane', email: 'jane@agency.com', role: AgencyRole.DSP },
        'org-uuid',
      );
      expect(result.message).toBe('User invited successfully');
      expect(result.data.id).toBe('user-uuid');
    });
  });

  describe('GET /admin/users/:id', () => {
    it('should get user by id', async () => {
      const result = await controller.findById('user-uuid', 'org-uuid');
      expect(result.message).toBe('User retrieved');
      expect(result.data.email).toBe('jane@agency.com');
    });
  });

  describe('PATCH /admin/users/:id', () => {
    it('should update user', async () => {
      const result = await controller.update('user-uuid', 'org-uuid', {
        name: 'Updated',
      });
      expect(result.message).toBe('User updated');
    });
  });

  describe('PATCH /admin/users/:id/role', () => {
    it('should assign role', async () => {
      const result = await controller.assignRole(
        'user-uuid',
        'org-uuid',
        { role: AgencyRole.SUPERVISOR },
        mockCurrentUser as unknown as AuthenticatedUser,
        mockReq as unknown as Request,
      );
      expect(result.message).toBe('Role assigned');
    });
  });

  describe('PATCH /admin/users/:id/permissions', () => {
    it('should update sub-permissions', async () => {
      const result = await controller.updateSubPermissions(
        'user-uuid',
        'org-uuid',
        { sub_permissions: { 'view:reports': true } },
        mockCurrentUser as unknown as AuthenticatedUser,
        mockReq as unknown as Request,
      );
      expect(result.message).toBe('Permissions updated');
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('should deactivate user', async () => {
      const result = await controller.deactivate(
        'user-uuid',
        'org-uuid',
        mockCurrentUser as unknown as AuthenticatedUser,
        mockReq as unknown as Request,
      );
      expect(result.message).toBe('User deactivated');
    });
  });
});
