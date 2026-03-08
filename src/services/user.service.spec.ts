import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { AgencyRole } from '@enums/role.enum';
import { UserStatus } from '@enums/user-status.enum';

describe('UserService', () => {
  let service: UserService;
  let userDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let auditLogService: { logAgencyAction: jest.Mock };

  const mockUser = {
    id: 'user-uuid',
    org_id: 'org-uuid',
    email: 'jane@agency.com',
    name: 'Jane Smith',
    role: AgencyRole.DSP,
    status: UserStatus.ACTIVE,
    sub_permissions: {},
  };

  beforeEach(() => {
    userDal = {
      find: jest.fn().mockResolvedValue({ payload: [mockUser], paginationMeta: { total: 1 } }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
    };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    service = new UserService(userDal as never, auditLogService as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    it('should return paginated users for org', async () => {
      const result = await service.list('org-uuid');
      expect(userDal.find).toHaveBeenCalledWith(
        expect.objectContaining({ findOptions: { org_id: 'org-uuid' } }),
      );
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('invite', () => {
    it('should create user with PENDING_INVITE status', async () => {
      const result = await service.invite(
        { name: 'Jane Smith', email: 'jane@agency.com', role: AgencyRole.DSP },
        'org-uuid',
      );

      expect(userDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            status: UserStatus.PENDING_INVITE,
            email_verified: false,
            password: null,
          }),
        }),
      );
      expect(result.id).toBe('user-uuid');
    });

    it('should throw BadRequestException if email already exists', async () => {
      userDal.get.mockResolvedValue(mockUser);

      await expect(
        service.invite(
          { name: 'Jane', email: 'jane@agency.com', role: AgencyRole.DSP },
          'org-uuid',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return user when found in same org', async () => {
      userDal.get.mockResolvedValue(mockUser);

      const result = await service.findById('user-uuid', 'org-uuid');
      expect(result.id).toBe('user-uuid');
    });

    it('should throw NotFoundException when user not found', async () => {
      userDal.get.mockResolvedValue(null);

      await expect(service.findById('bad-id', 'org-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update user when found', async () => {
      userDal.get.mockResolvedValue(mockUser);

      await service.update('user-uuid', 'org-uuid', { name: 'Updated Name' });

      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({ updatePayload: { name: 'Updated Name' } }),
      );
    });

    it('should throw NotFoundException for wrong org', async () => {
      userDal.get.mockResolvedValue(null);

      await expect(
        service.update('user-uuid', 'other-org', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignRole', () => {
    it('should update user role and log audit', async () => {
      userDal.get.mockResolvedValue(mockUser);

      await service.assignRole(
        'user-uuid',
        'org-uuid',
        AgencyRole.SUPERVISOR,
        'admin-uuid',
        '127.0.0.1',
        'jest',
      );

      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: { role: AgencyRole.SUPERVISOR },
        }),
      );
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ROLE_ASSIGNED' }),
      );
    });

    it('should throw NotFoundException when user not in org', async () => {
      userDal.get.mockResolvedValue(null);

      await expect(
        service.assignRole(
          'bad-id',
          'org-uuid',
          AgencyRole.SUPERVISOR,
          'admin-uuid',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSubPermissions', () => {
    it('should update sub_permissions', async () => {
      userDal.get.mockResolvedValue(mockUser);

      await service.updateSubPermissions('user-uuid', 'org-uuid', {
        'view:reports': true,
      });

      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: { sub_permissions: { 'view:reports': true } },
        }),
      );
    });
  });

  describe('deactivate', () => {
    it('should archive user', async () => {
      userDal.get.mockResolvedValue(mockUser);

      await service.deactivate('user-uuid', 'org-uuid');

      expect(userDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: { status: UserStatus.ARCHIVED },
        }),
      );
    });
  });
});
