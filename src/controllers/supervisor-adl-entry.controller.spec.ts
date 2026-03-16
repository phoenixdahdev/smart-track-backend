import { SupervisorAdlEntryController } from './supervisor-adl-entry.controller';
import { AssistanceLevel } from '@enums/assistance-level.enum';

describe('SupervisorAdlEntryController', () => {
  let controller: SupervisorAdlEntryController;
  let adlEntryService: {
    findByServiceRecord: jest.Mock;
    findById: jest.Mock;
    findByIndividual: jest.Mock;
  };

  const mockEntry = {
    id: 'entry-uuid',
    service_record_id: 'sr-uuid',
    individual_id: 'ind-uuid',
    adl_category_id: 'cat-uuid',
    assistance_level: AssistanceLevel.VERBAL_PROMPT,
    notes: 'Decrypted notes',
  };

  const mockCurrentUser = {
    id: 'supervisor-uuid',
    org_id: 'org-uuid',
    role: 'SUPERVISOR',
    email: 'supervisor@test.com',
    name: 'Supervisor User',
    sub_permissions: {},
    session_timeout: 3600,
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
    adlEntryService = {
      findByServiceRecord: jest.fn().mockResolvedValue({
        payload: [mockEntry],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockEntry),
      findByIndividual: jest.fn().mockResolvedValue({
        payload: [mockEntry],
        paginationMeta: { total: 1 },
      }),
    };

    controller = new SupervisorAdlEntryController(adlEntryService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /supervisor/adl-entries/service-record/:serviceRecordId', () => {
    it('should list ADL entries for a service record', async () => {
      const result = await controller.listByServiceRecord('sr-uuid', 'org-uuid');

      expect(result.message).toBe('ADL entries retrieved');
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1 });
      expect(adlEntryService.findByServiceRecord).toHaveBeenCalledWith(
        'sr-uuid',
        'org-uuid',
      );
    });
  });

  describe('GET /supervisor/adl-entries/:id', () => {
    it('should get a single ADL entry by ID', async () => {
      const result = await controller.findById(
        'entry-uuid',
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('ADL entry retrieved');
      expect(result.data).toEqual(mockEntry);
      expect(adlEntryService.findById).toHaveBeenCalledWith(
        'entry-uuid',
        'org-uuid',
        'supervisor-uuid',
        'SUPERVISOR',
        '127.0.0.1',
        'jest',
      );
    });
  });

  describe('GET /supervisor/adl-entries/individual/:individualId', () => {
    it('should list ADL history for an individual', async () => {
      const query = {};

      const result = await controller.listByIndividual(
        'ind-uuid',
        query as never,
        'org-uuid',
      );

      expect(result.message).toBe('ADL entries retrieved');
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1 });
      expect(adlEntryService.findByIndividual).toHaveBeenCalledWith(
        expect.objectContaining({ individual_id: 'ind-uuid' }),
        'org-uuid',
      );
    });

    it('should pass query filters to service', async () => {
      const query = { date_from: '2026-03-01', date_to: '2026-03-31' };

      await controller.listByIndividual(
        'ind-uuid',
        query as never,
        'org-uuid',
      );

      expect(adlEntryService.findByIndividual).toHaveBeenCalledWith(
        expect.objectContaining({
          individual_id: 'ind-uuid',
          date_from: '2026-03-01',
          date_to: '2026-03-31',
        }),
        'org-uuid',
      );
    });
  });
});
