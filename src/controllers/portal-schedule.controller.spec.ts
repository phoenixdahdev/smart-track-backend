import { PortalScheduleController } from './portal-schedule.controller';

describe('PortalScheduleController', () => {
  let controller: PortalScheduleController;
  let guardianPortalService: { getUpcomingSchedule: jest.Mock };

  const mockCurrentUser = {
    id: 'guardian-uuid',
    org_id: 'org-uuid',
    role: 'GUARDIAN',
    email: 'guardian@test.com',
    name: 'Guardian User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  const mockShift = {
    id: 'shift-uuid',
    shift_date: '2026-03-20',
    start_time: '09:00',
    end_time: '17:00',
    status: 'PUBLISHED',
  };

  beforeEach(() => {
    guardianPortalService = {
      getUpcomingSchedule: jest.fn().mockResolvedValue({
        payload: [mockShift],
        paginationMeta: { total: 1 },
      }),
    };

    controller = new PortalScheduleController(guardianPortalService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /portal/individuals/:id/schedule', () => {
    it('should list upcoming shifts', async () => {
      const result = await controller.list('ind-uuid', mockCurrentUser as never, {});
      expect(result.message).toBe('Schedule retrieved');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('staff_id');
    });
  });
});
