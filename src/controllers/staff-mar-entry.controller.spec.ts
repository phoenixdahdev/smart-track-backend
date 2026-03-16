import { StaffMarEntryController } from './staff-mar-entry.controller';
import { MarResult } from '@enums/mar-result.enum';

describe('StaffMarEntryController', () => {
  let controller: StaffMarEntryController;
  let marEntryService: {
    create: jest.Mock;
    listByIndividual: jest.Mock;
    findById: jest.Mock;
  };

  const mockEntry = { id: 'mar-uuid', drug_name: 'Risperidone' };
  const mockCurrentUser = {
    id: 'staff-uuid', org_id: 'org-uuid', role: 'DSP',
    email: 'dsp@test.com', name: 'DSP', sub_permissions: {},
    session_timeout: 3600, mfa_enabled: false, mfa_type: 'NONE', mfa_verified: true, email_verified: true,
  };
  const mockReq = {
    ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    marEntryService = {
      create: jest.fn().mockResolvedValue(mockEntry),
      listByIndividual: jest.fn().mockResolvedValue({
        payload: [mockEntry], paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockEntry),
    };
    controller = new StaffMarEntryController(marEntryService as never);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });

  describe('POST /staff/mar-entries', () => {
    it('should create a MAR entry', async () => {
      const dto = {
        individual_id: 'ind-uuid', drug_name: 'Med', dose: '1mg',
        scheduled_time: '2026-03-10T08:00:00.000Z', result: MarResult.GIVEN,
      };
      const result = await controller.create(dto, mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('MAR entry recorded');
    });
  });

  describe('GET /staff/mar-entries/by-individual/:id', () => {
    it('should list entries by individual', async () => {
      const result = await controller.listByIndividual('ind-uuid', 'org-uuid', {} as never);
      expect(result.data).toHaveLength(1);
    });
  });
});
