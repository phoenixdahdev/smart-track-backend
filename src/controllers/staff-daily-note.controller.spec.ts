import { StaffDailyNoteController } from './staff-daily-note.controller';

describe('StaffDailyNoteController', () => {
  let controller: StaffDailyNoteController;
  let dailyNoteService: {
    create: jest.Mock;
    findByServiceRecord: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };

  const mockNote = {
    id: 'note-uuid',
    service_record_id: 'sr-uuid',
    content: 'Decrypted content',
    observations: null,
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
    dailyNoteService = {
      create: jest.fn().mockResolvedValue(mockNote),
      findByServiceRecord: jest.fn().mockResolvedValue({
        payload: [mockNote],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockNote),
      update: jest.fn().mockResolvedValue(mockNote),
    };

    controller = new StaffDailyNoteController(dailyNoteService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /staff/service-records/:id/daily-notes', () => {
    it('should create a daily note', async () => {
      const result = await controller.create(
        'sr-uuid',
        { content: 'Test note' },
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('Daily note created');
      expect(dailyNoteService.create).toHaveBeenCalledWith(
        'sr-uuid',
        { content: 'Test note' },
        'org-uuid',
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );
    });
  });

  describe('GET /staff/service-records/:id/daily-notes', () => {
    it('should list daily notes', async () => {
      const result = await controller.list('sr-uuid', 'org-uuid');

      expect(result.message).toBe('Daily notes retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /staff/service-records/:id/daily-notes/:noteId', () => {
    it('should get a daily note by ID', async () => {
      const result = await controller.findById(
        'note-uuid',
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('Daily note retrieved');
    });
  });
});
