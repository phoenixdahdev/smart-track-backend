import { SuperadminApplicationController } from './superadmin-application.controller';
import { ApplicationStatus } from '@enums/application-status.enum';
import { PlatformRole } from '@enums/role.enum';

describe('SuperadminApplicationController', () => {
  let controller: SuperadminApplicationController;
  let applicationService: {
    submit: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    transition: jest.Mock;
    assign: jest.Mock;
    addNote: jest.Mock;
    getNotes: jest.Mock;
    getDocuments: jest.Mock;
    verifyDocument: jest.Mock;
    getSummaryCounts: jest.Mock;
  };
  let provisioningService: { provision: jest.Mock };

  const mockApplication = {
    id: 'app-uuid',
    org_name: 'Test Agency',
    status: ApplicationStatus.SUBMITTED,
  };

  const mockCurrentUser = {
    id: 'op-uuid',
    role: PlatformRole.PLATFORM_ADMIN,
    org_id: null,
    email: 'admin@smarttrack.com',
    name: 'Admin',
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
    applicationService = {
      submit: jest.fn().mockResolvedValue({ ...mockApplication, risk: { score: 'LOW', factors: [] } }),
      findById: jest.fn().mockResolvedValue(mockApplication),
      list: jest.fn().mockResolvedValue({ payload: [mockApplication], paginationMeta: { total: 1 } }),
      transition: jest.fn().mockResolvedValue({ ...mockApplication, status: ApplicationStatus.UNDER_REVIEW }),
      assign: jest.fn().mockResolvedValue(mockApplication),
      addNote: jest.fn().mockResolvedValue({ id: 'note-uuid', note_text: 'Test' }),
      getNotes: jest.fn().mockResolvedValue({ payload: [] }),
      getDocuments: jest.fn().mockResolvedValue({ payload: [] }),
      verifyDocument: jest.fn().mockResolvedValue({ id: 'doc-uuid', verified: true }),
      getSummaryCounts: jest.fn().mockResolvedValue({ SUBMITTED: 5, UNDER_REVIEW: 2 }),
    };
    provisioningService = {
      provision: jest.fn().mockResolvedValue({
        application_id: 'app-uuid',
        org_id: 'org-uuid',
        admin_user_id: 'user-uuid',
        subscription_id: 'sub-uuid',
        checklist_id: 'checklist-uuid',
        modules_enabled: ['billing'],
      }),
    };

    controller = new SuperadminApplicationController(
      applicationService as never,
      provisioningService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /superadmin/applications/public/signup', () => {
    it('should submit a public application', async () => {
      const dto = {
        org_name: 'Test Agency',
        npi: '1234567890',
        ein: '123456789',
        contact_name: 'John',
        contact_email: 'john@test.com',
      };

      const result = await controller.submit(dto);

      expect(result.message).toBe('Application submitted');
      expect(applicationService.submit).toHaveBeenCalledWith(dto);
    });
  });

  describe('GET /superadmin/applications', () => {
    it('should list applications', async () => {
      const result = await controller.list({} as never);

      expect(result.message).toBe('Applications retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /superadmin/applications/summary', () => {
    it('should get summary counts', async () => {
      const result = await controller.summary();

      expect(result.message).toBe('Summary counts retrieved');
      expect(result.data.SUBMITTED).toBe(5);
    });
  });

  describe('GET /superadmin/applications/:id', () => {
    it('should get application by ID', async () => {
      const result = await controller.findById('app-uuid');

      expect(result.message).toBe('Application retrieved');
    });
  });

  describe('POST /superadmin/applications/:id/transition', () => {
    it('should transition application status', async () => {
      const dto = { status: ApplicationStatus.UNDER_REVIEW };

      const result = await controller.transition('app-uuid', dto as never, mockCurrentUser as never, mockReq as never);

      expect(result.message).toBe('Application status updated');
    });
  });

  describe('POST /superadmin/applications/:id/assign', () => {
    it('should assign reviewer', async () => {
      const result = await controller.assign(
        'app-uuid', 'reviewer-uuid', mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Reviewer assigned');
    });
  });

  describe('POST /superadmin/applications/:id/notes', () => {
    it('should add note', async () => {
      const result = await controller.addNote(
        'app-uuid', { note_text: 'Test' }, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Note added');
    });
  });

  describe('GET /superadmin/applications/:id/notes', () => {
    it('should get notes', async () => {
      const result = await controller.getNotes('app-uuid');
      expect(result.message).toBe('Notes retrieved');
    });
  });

  describe('GET /superadmin/applications/:id/documents', () => {
    it('should get documents', async () => {
      const result = await controller.getDocuments('app-uuid');
      expect(result.message).toBe('Documents retrieved');
    });
  });

  describe('PATCH /superadmin/applications/:id/documents/:docId/verify', () => {
    it('should verify document', async () => {
      const result = await controller.verifyDocument(
        'doc-uuid', { verified: true }, mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('Document verification updated');
    });
  });

  describe('POST /superadmin/applications/:id/provision', () => {
    it('should provision tenant', async () => {
      const result = await controller.provision('app-uuid', mockCurrentUser as never, mockReq as never);

      expect(result.message).toBe('Tenant provisioned');
      expect(result.data.org_id).toBe('org-uuid');
    });
  });
});
