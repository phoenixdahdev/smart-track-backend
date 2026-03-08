import { NotFoundException } from '@nestjs/common';
import { StaffAssignmentService } from './staff-assignment.service';

describe('StaffAssignmentService', () => {
  let service: StaffAssignmentService;
  let staffAssignmentDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
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

  beforeEach(() => {
    staffAssignmentDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockAssignment],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockAssignment),
      update: jest.fn().mockResolvedValue(mockAssignment),
    };

    service = new StaffAssignmentService(staffAssignmentDal as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listByIndividual', () => {
    it('should filter by individual_id and org_id', async () => {
      await service.listByIndividual('ind-uuid', 'org-uuid');
      expect(staffAssignmentDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: { individual_id: 'ind-uuid', org_id: 'org-uuid' },
        }),
      );
    });
  });

  describe('listByStaff', () => {
    it('should filter by staff_id and org_id', async () => {
      await service.listByStaff('staff-uuid', 'org-uuid');
      expect(staffAssignmentDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: { staff_id: 'staff-uuid', org_id: 'org-uuid' },
        }),
      );
    });
  });

  describe('create', () => {
    it('should create assignment with org_id and active=true', async () => {
      const result = await service.create(
        {
          staff_id: 'staff-uuid',
          individual_id: 'ind-uuid',
          program_id: 'prog-uuid',
          effective_date: '2026-01-01',
        },
        'org-uuid',
      );

      expect(staffAssignmentDal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            org_id: 'org-uuid',
            staff_id: 'staff-uuid',
            active: true,
          }) as unknown,
        }),
      );
      expect(result.id).toBe('assign-uuid');
    });
  });

  describe('findById', () => {
    it('should return assignment when found', async () => {
      staffAssignmentDal.get.mockResolvedValue(mockAssignment);

      const result = await service.findById('assign-uuid', 'org-uuid');
      expect(result.id).toBe('assign-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      staffAssignmentDal.get.mockResolvedValue(null);

      await expect(
        service.findById('bad-id', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update assignment', async () => {
      staffAssignmentDal.get.mockResolvedValue(mockAssignment);

      await service.update('assign-uuid', 'org-uuid', {
        end_date: '2026-06-30',
      });

      expect(staffAssignmentDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: { end_date: '2026-06-30' },
        }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      staffAssignmentDal.get.mockResolvedValue(null);

      await expect(
        service.update('bad-id', 'org-uuid', { active: false }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('endAssignment', () => {
    it('should set end_date and active=false', async () => {
      staffAssignmentDal.get.mockResolvedValue(mockAssignment);

      await service.endAssignment('assign-uuid', 'org-uuid', '2026-12-31');

      expect(staffAssignmentDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: { end_date: '2026-12-31', active: false },
        }),
      );
    });
  });
});
