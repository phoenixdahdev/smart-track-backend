import { NotFoundException } from '@nestjs/common';
import { GuardianPortalService } from './guardian-portal.service';
import { GuardianRelationship } from '@enums/guardian-relationship.enum';

const mockEncrypt = jest.fn((v: string) => `ENC(${v})`);
const mockDecrypt = jest.fn((v: string) => v.replace(/^ENC\((.+)\)$/, '$1'));

describe('GuardianPortalService', () => {
  let service: GuardianPortalService;
  let guardianIndividualDal: { get: jest.Mock; find: jest.Mock };
  let individualDal: { get: jest.Mock };
  let serviceRecordDal: { find: jest.Mock };
  let dailyNoteDal: { find: jest.Mock };
  let ispGoalDal: { get: jest.Mock; find: jest.Mock };
  let ispDataPointDal: { find: jest.Mock };
  let incidentDal: { find: jest.Mock };
  let shiftDal: { find: jest.Mock };
  let marEntryDal: { find: jest.Mock };
  let adlEntryDal: { find: jest.Mock };
  let adlCategoryDal: { get: jest.Mock };
  let encryptionService: { encrypt: jest.Mock; decrypt: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };
  let notificationService: { getUnreadCount: jest.Mock };

  const mockLink = {
    id: 'link-uuid',
    guardian_id: 'guardian-uuid',
    individual_id: 'ind-uuid',
    org_id: 'org-uuid',
    relationship: GuardianRelationship.PARENT,
    active: true,
  };

  const mockIndividual = {
    id: 'ind-uuid',
    org_id: 'org-uuid',
    first_name: 'ENC(John)',
    last_name: 'ENC(Doe)',
    date_of_birth: 'ENC(2000-01-15)',
    ssn: 'ENC(123-45-6789)',
    medicaid_id: 'ENC(MED123)',
    diagnosis_codes: 'ENC(F84.0)',
    active: true,
  };

  const mockServiceRecord = {
    id: 'sr-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    staff_id: 'staff-uuid',
    service_date: '2026-03-15',
    units_delivered: 4,
    status: 'APPROVED',
    program_id: 'prog-uuid',
    approved_by: 'supervisor-uuid',
  };

  const mockIncident = {
    id: 'inc-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    reported_by: 'staff-uuid',
    type: 'BEHAVIORAL',
    description: 'ENC(Incident details)',
    immediate_action: 'ENC(Staff intervened)',
    supervisor_comments: null,
    status: 'SUBMITTED',
    occurred_at: new Date('2026-03-10T14:00:00Z'),
  };

  const mockGoal = {
    id: 'goal-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    description: 'ENC(Improve social skills)',
    target: '80%',
    effective_start: '2026-01-01',
    effective_end: null,
    active: true,
  };

  const mockDataPoint = {
    id: 'dp-uuid',
    org_id: 'org-uuid',
    goal_id: 'goal-uuid',
    value: '75',
    recorded_at: new Date('2026-03-10T10:00:00Z'),
    recorded_by: 'staff-uuid',
  };

  const mockShift = {
    id: 'shift-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    staff_id: 'staff-uuid',
    shift_date: '2026-03-20',
    start_time: '09:00',
    end_time: '17:00',
    status: 'PUBLISHED',
    created_by: 'admin-uuid',
  };

  const mockMarEntry = {
    id: 'mar-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    administered_by: 'staff-uuid',
    drug_name: 'ENC(Lisinopril)',
    dose: 'ENC(10mg)',
    route: 'ENC(oral)',
    scheduled_time: new Date('2026-03-15T08:00:00Z'),
    administered_time: new Date('2026-03-15T08:05:00Z'),
    result: 'GIVEN',
    notes: 'Taken with water',
  };

  const mockAdlEntry = {
    id: 'adl-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    staff_id: 'staff-uuid',
    adl_category_id: 'cat-uuid',
    assistance_level: 'VERBAL_PROMPT',
    notes: 'Assisted with dressing',
    recorded_at: new Date('2026-03-15T09:00:00Z'),
  };

  const mockCategory = {
    id: 'cat-uuid',
    name: 'Dressing',
    org_id: 'org-uuid',
  };

  const auditCtx = {
    userId: 'guardian-uuid',
    userRole: 'GUARDIAN',
    ip: '127.0.0.1',
    userAgent: 'jest',
  };

  beforeEach(() => {
    guardianIndividualDal = {
      get: jest.fn().mockResolvedValue(mockLink),
      find: jest.fn().mockResolvedValue({
        payload: [mockLink],
        paginationMeta: { total: 1 },
      }),
    };

    individualDal = {
      get: jest.fn().mockResolvedValue(mockIndividual),
    };

    serviceRecordDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockServiceRecord],
        paginationMeta: { total: 1 },
      }),
    };

    dailyNoteDal = {
      find: jest.fn().mockResolvedValue({
        payload: [{ id: 'note-uuid' }],
        paginationMeta: { total: 1 },
      }),
    };

    ispGoalDal = {
      get: jest.fn().mockResolvedValue(mockGoal),
      find: jest.fn().mockResolvedValue({
        payload: [mockGoal],
        paginationMeta: { total: 1 },
      }),
    };

    ispDataPointDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockDataPoint],
        paginationMeta: { total: 1 },
      }),
    };

    incidentDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockIncident],
        paginationMeta: { total: 1 },
      }),
    };

    shiftDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockShift],
        paginationMeta: { total: 1 },
      }),
    };

    marEntryDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockMarEntry],
        paginationMeta: { total: 1 },
      }),
    };

    adlEntryDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockAdlEntry],
        paginationMeta: { total: 1 },
      }),
    };

    adlCategoryDal = {
      get: jest.fn().mockResolvedValue(mockCategory),
    };

    encryptionService = { encrypt: mockEncrypt, decrypt: mockDecrypt };

    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };

    notificationService = {
      getUnreadCount: jest.fn().mockResolvedValue({ count: 3 }),
    };

    service = new GuardianPortalService(
      guardianIndividualDal as never,
      individualDal as never,
      serviceRecordDal as never,
      dailyNoteDal as never,
      ispGoalDal as never,
      ispDataPointDal as never,
      incidentDal as never,
      shiftDal as never,
      marEntryDal as never,
      adlEntryDal as never,
      adlCategoryDal as never,
      encryptionService as never,
      auditLogService as never,
      notificationService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── Access Validation ────────────────────────────────────────

  describe('validateGuardianAccess', () => {
    it('should pass when active link exists', async () => {
      await expect(
        service.validateGuardianAccess('guardian-uuid', 'ind-uuid', 'org-uuid'),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException when link does not exist', async () => {
      guardianIndividualDal.get.mockResolvedValue(null);

      await expect(
        service.validateGuardianAccess('guardian-uuid', 'ind-uuid', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for inactive link', async () => {
      guardianIndividualDal.get.mockResolvedValue(null);

      await expect(
        service.validateGuardianAccess('guardian-uuid', 'other-ind', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Linked Individuals ──────────────────────────────────────

  describe('getLinkedIndividuals', () => {
    it('should return redacted individual summaries', async () => {
      const result = await service.getLinkedIndividuals('guardian-uuid', 'org-uuid');

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0]).toHaveProperty('first_name');
      expect(result.payload[0]).toHaveProperty('relationship');
      expect(result.payload[0]).not.toHaveProperty('ssn');
      expect(result.payload[0]).not.toHaveProperty('medicaid_id');
      expect(result.payload[0]).not.toHaveProperty('diagnosis_codes');
    });

    it('should decrypt first_name and last_name', async () => {
      const result = await service.getLinkedIndividuals('guardian-uuid', 'org-uuid');

      expect(mockDecrypt).toHaveBeenCalledWith('ENC(John)');
      expect(result.payload[0].first_name).toBe('John');
    });
  });

  // ── Individual Profile ──────────────────────────────────────

  describe('getIndividualProfile', () => {
    it('should return redacted profile with age instead of DOB', async () => {
      const result = await service.getIndividualProfile(
        'guardian-uuid', 'ind-uuid', 'org-uuid', auditCtx,
      );

      expect(result).toHaveProperty('age');
      expect(typeof result.age).toBe('number');
      expect(result).not.toHaveProperty('date_of_birth');
      expect(result).not.toHaveProperty('ssn');
      expect(result).not.toHaveProperty('medicaid_id');
    });

    it('should log PHI access audit', async () => {
      await service.getIndividualProfile(
        'guardian-uuid', 'ind-uuid', 'org-uuid', auditCtx,
      );

      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'GUARDIAN_INDIVIDUAL_PROFILE_ACCESSED' }),
      );
    });

    it('should throw when guardian has no access', async () => {
      guardianIndividualDal.get.mockResolvedValue(null);

      await expect(
        service.getIndividualProfile(
          'guardian-uuid', 'other-ind', 'org-uuid', auditCtx,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Dashboard ───────────────────────────────────────────────

  describe('getDashboard', () => {
    it('should return aggregate dashboard data', async () => {
      const result = await service.getDashboard('guardian-uuid', 'ind-uuid', 'org-uuid');

      expect(result.individual_id).toBe('ind-uuid');
      expect(result.individual_name).toContain('John');
      expect(result.recent_service_count).toBe(1);
      expect(result.upcoming_shift_count).toBe(1);
      expect(result.active_isp_goals).toBe(1);
      expect(result.recent_incident_count).toBe(1);
      expect(result.unread_notification_count).toBe(3);
    });

    it('should throw when guardian has no access', async () => {
      guardianIndividualDal.get.mockResolvedValue(null);

      await expect(
        service.getDashboard('guardian-uuid', 'other-ind', 'org-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Service Record Summaries ────────────────────────────────

  describe('getServiceRecordSummaries', () => {
    it('should return redacted summaries without staff_id and approved_by', async () => {
      const result = await service.getServiceRecordSummaries(
        'guardian-uuid', 'ind-uuid', 'org-uuid', {},
      );

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0]).toHaveProperty('id');
      expect(result.payload[0]).toHaveProperty('has_daily_notes', true);
      expect(result.payload[0]).not.toHaveProperty('staff_id');
      expect(result.payload[0]).not.toHaveProperty('approved_by');
    });

    it('should throw when guardian has no access', async () => {
      guardianIndividualDal.get.mockResolvedValue(null);

      await expect(
        service.getServiceRecordSummaries(
          'guardian-uuid', 'other-ind', 'org-uuid', {},
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Incident Summaries ──────────────────────────────────────

  describe('getIncidentSummaries', () => {
    it('should return redacted summaries without description or reported_by', async () => {
      const result = await service.getIncidentSummaries(
        'guardian-uuid', 'ind-uuid', 'org-uuid', {},
      );

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0]).toHaveProperty('type');
      expect(result.payload[0]).toHaveProperty('occurred_at');
      expect(result.payload[0]).not.toHaveProperty('description');
      expect(result.payload[0]).not.toHaveProperty('reported_by');
      expect(result.payload[0]).not.toHaveProperty('immediate_action');
      expect(result.payload[0]).not.toHaveProperty('supervisor_comments');
    });

    it('should throw when guardian has no access', async () => {
      guardianIndividualDal.get.mockResolvedValue(null);

      await expect(
        service.getIncidentSummaries(
          'guardian-uuid', 'other-ind', 'org-uuid', {},
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── ISP Goals ───────────────────────────────────────────────

  describe('getIspGoals', () => {
    it('should return goals with decrypted descriptions and data point counts', async () => {
      const result = await service.getIspGoals(
        'guardian-uuid', 'ind-uuid', 'org-uuid', {},
      );

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0].description).toBe('Improve social skills');
      expect(result.payload[0].data_point_count).toBe(1);
    });

    it('should throw when guardian has no access', async () => {
      guardianIndividualDal.get.mockResolvedValue(null);

      await expect(
        service.getIspGoals('guardian-uuid', 'other-ind', 'org-uuid', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── ISP Goal Progress ──────────────────────────────────────

  describe('getIspGoalProgress', () => {
    it('should return data points without recorded_by', async () => {
      const result = await service.getIspGoalProgress(
        'guardian-uuid', 'ind-uuid', 'goal-uuid', 'org-uuid',
      );

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0]).toHaveProperty('value');
      expect(result.payload[0]).toHaveProperty('recorded_at');
      expect(result.payload[0]).not.toHaveProperty('recorded_by');
    });

    it('should throw when goal does not exist', async () => {
      ispGoalDal.get.mockResolvedValue(null);

      await expect(
        service.getIspGoalProgress(
          'guardian-uuid', 'ind-uuid', 'bad-goal', 'org-uuid',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Schedule ────────────────────────────────────────────────

  describe('getUpcomingSchedule', () => {
    it('should return redacted shifts without staff_id and created_by', async () => {
      const result = await service.getUpcomingSchedule(
        'guardian-uuid', 'ind-uuid', 'org-uuid', {},
      );

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0]).toHaveProperty('shift_date');
      expect(result.payload[0]).toHaveProperty('start_time');
      expect(result.payload[0]).not.toHaveProperty('staff_id');
      expect(result.payload[0]).not.toHaveProperty('created_by');
    });
  });

  // ── MAR Summaries ──────────────────────────────────────────

  describe('getMarSummaries', () => {
    it('should return redacted MAR entries with decrypted drug_name', async () => {
      const result = await service.getMarSummaries(
        'guardian-uuid', 'ind-uuid', 'org-uuid', {},
      );

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0].drug_name).toBe('Lisinopril');
      expect(result.payload[0]).not.toHaveProperty('administered_by');
      expect(result.payload[0]).not.toHaveProperty('dose');
      expect(result.payload[0]).not.toHaveProperty('route');
      expect(result.payload[0]).not.toHaveProperty('notes');
    });
  });

  // ── ADL Summaries ──────────────────────────────────────────

  describe('getAdlSummaries', () => {
    it('should return redacted ADL entries with category name', async () => {
      const result = await service.getAdlSummaries(
        'guardian-uuid', 'ind-uuid', 'org-uuid',
      );

      expect(result.payload).toHaveLength(1);
      expect(result.payload[0].category_name).toBe('Dressing');
      expect(result.payload[0]).toHaveProperty('assistance_level');
      expect(result.payload[0]).not.toHaveProperty('staff_id');
      expect(result.payload[0]).not.toHaveProperty('notes');
    });
  });
});
