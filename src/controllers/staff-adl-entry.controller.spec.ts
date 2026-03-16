import { StaffAdlEntryController } from './staff-adl-entry.controller';
import { AssistanceLevel } from '@enums/assistance-level.enum';

describe('StaffAdlEntryController', () => {
  let controller: StaffAdlEntryController;
  let adlEntryService: {
    create: jest.Mock;
    bulkCreate: jest.Mock;
    findByServiceRecord: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
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
    id: 'staff-uuid',
    org_id: 'org-uuid',
    role: 'DSP',
    email: 'dsp@test.com',
    name: 'DSP User',
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
      create: jest.fn().mockResolvedValue(mockEntry),
      bulkCreate: jest.fn().mockResolvedValue([mockEntry, mockEntry]),
      findByServiceRecord: jest.fn().mockResolvedValue({
        payload: [mockEntry],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockEntry),
      update: jest.fn().mockResolvedValue(mockEntry),
    };

    controller = new StaffAdlEntryController(adlEntryService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /staff/adl-entries', () => {
    it('should create an ADL entry', async () => {
      const dto = {
        service_record_id: 'sr-uuid',
        individual_id: 'ind-uuid',
        adl_category_id: 'cat-uuid',
        assistance_level: AssistanceLevel.VERBAL_PROMPT,
        notes: 'Test notes',
      };

      const result = await controller.create(
        dto as never,
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('ADL entry created');
      expect(result.data).toEqual(mockEntry);
      expect(adlEntryService.create).toHaveBeenCalledWith(
        dto,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );
    });
  });

  describe('POST /staff/adl-entries/bulk', () => {
    it('should bulk create ADL entries', async () => {
      const entries = [
        {
          service_record_id: 'sr-uuid',
          individual_id: 'ind-uuid',
          adl_category_id: 'cat-uuid',
          assistance_level: AssistanceLevel.VERBAL_PROMPT,
        },
        {
          service_record_id: 'sr-uuid',
          individual_id: 'ind-uuid',
          adl_category_id: 'cat-uuid',
          assistance_level: AssistanceLevel.SUPERVISED,
        },
      ];

      const result = await controller.bulkCreate(
        entries as never,
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('2 ADL entries created');
      expect(result.data).toHaveLength(2);
      expect(adlEntryService.bulkCreate).toHaveBeenCalledWith(
        entries,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );
    });
  });

  describe('GET /staff/adl-entries/service-record/:serviceRecordId', () => {
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

  describe('GET /staff/adl-entries/:id', () => {
    it('should get an ADL entry by ID', async () => {
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
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );
    });
  });

  describe('PATCH /staff/adl-entries/:id', () => {
    it('should update an ADL entry', async () => {
      const dto = { notes: 'Updated notes' };

      const result = await controller.update(
        'entry-uuid',
        dto as never,
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('ADL entry updated');
      expect(result.data).toEqual(mockEntry);
      expect(adlEntryService.update).toHaveBeenCalledWith(
        'entry-uuid',
        dto,
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );
    });
  });
});
