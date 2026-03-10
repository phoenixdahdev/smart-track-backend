import { StaffAssignmentController } from './staff-assignment.controller';
import { StaffAssignmentService } from '@services/staff-assignment.service';
import { AgencyRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { type Request } from 'express';

describe('StaffAssignmentController', () => {
  let controller: StaffAssignmentController;
  let staffAssignmentService: {
    listByIndividual: jest.Mock;
    listByStaff: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    endAssignment: jest.Mock;
  };

  const mockAssignment = {
    id: 'assign-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    individual_id: 'ind-uuid',
    program_id: 'prog-uuid',
    effective_date: '2026-01-01',
    end_date: null,
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
    staffAssignmentService = {
      listByIndividual: jest.fn().mockResolvedValue({
        payload: [mockAssignment],
        paginationMeta: { total: 1 },
      }),
      listByStaff: jest.fn().mockResolvedValue({
        payload: [mockAssignment],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockAssignment),
      findById: jest.fn().mockResolvedValue(mockAssignment),
      update: jest.fn().mockResolvedValue(mockAssignment),
      endAssignment: jest.fn().mockResolvedValue({
        ...mockAssignment,
        end_date: '2026-12-31',
        active: false,
      }),
    };

    controller = new StaffAssignmentController(
      staffAssignmentService as unknown as StaffAssignmentService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/staff-assignments/by-individual/:id', () => {
    it('should list by individual', async () => {
      const result = await controller.listByIndividual(
        'ind-uuid',
        'org-uuid',
        {},
      );
      expect(result.message).toBe('Staff assignments retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /admin/staff-assignments/by-staff/:staffId', () => {
    it('should list by staff', async () => {
      const result = await controller.listByStaff('staff-uuid', 'org-uuid', {});
      expect(result.message).toBe('Staff assignments retrieved');
      expect(result.data[0].staff_id).toBe('staff-uuid');
    });
  });

  describe('POST /admin/staff-assignments', () => {
    it('should create assignment', async () => {
      const result = await controller.create(
        {
          staff_id: 'staff-uuid',
          individual_id: 'ind-uuid',
          program_id: 'prog-uuid',
          effective_date: '2026-01-01',
        },
        'org-uuid',
        mockCurrentUser as unknown as AuthenticatedUser,
        mockReq as unknown as Request,
      );
      expect(result.message).toBe('Staff assignment created');
      expect(result.data.id).toBe('assign-uuid');
    });
  });

  describe('GET /admin/staff-assignments/:id', () => {
    it('should get assignment by id', async () => {
      const result = await controller.findById('assign-uuid', 'org-uuid');
      expect(result.message).toBe('Staff assignment retrieved');
    });
  });

  describe('PATCH /admin/staff-assignments/:id', () => {
    it('should update assignment', async () => {
      const result = await controller.update(
        'assign-uuid',
        'org-uuid',
        { end_date: '2026-06-30' },
        mockCurrentUser as unknown as AuthenticatedUser,
        mockReq as unknown as Request,
      );
      expect(result.message).toBe('Staff assignment updated');
    });
  });

  describe('PATCH /admin/staff-assignments/:id/end', () => {
    it('should end assignment', async () => {
      const result = await controller.endAssignment(
        'assign-uuid',
        'org-uuid',
        { end_date: '2026-12-31' },
        mockCurrentUser as unknown as AuthenticatedUser,
        mockReq as unknown as Request,
      );
      expect(result.message).toBe('Staff assignment ended');
      expect(result.data.active).toBe(false);
    });
  });
});
