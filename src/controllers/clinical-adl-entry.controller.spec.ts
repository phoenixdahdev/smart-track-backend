import { ClinicalAdlEntryController } from './clinical-adl-entry.controller';
import { AssistanceLevel } from '@enums/assistance-level.enum';

describe('ClinicalAdlEntryController', () => {
  let controller: ClinicalAdlEntryController;
  let adlEntryService: {
    findByIndividual: jest.Mock;
    getAdlSummary: jest.Mock;
  };

  const mockEntry = {
    id: 'entry-uuid',
    service_record_id: 'sr-uuid',
    individual_id: 'ind-uuid',
    adl_category_id: 'cat-uuid',
    assistance_level: AssistanceLevel.VERBAL_PROMPT,
    notes: 'Decrypted notes',
  };

  const mockSummary = [
    {
      adl_category_id: 'cat-uuid',
      assistance_level: AssistanceLevel.VERBAL_PROMPT,
      recorded_at: new Date('2026-03-15'),
    },
  ];

  beforeEach(() => {
    adlEntryService = {
      findByIndividual: jest.fn().mockResolvedValue({
        payload: [mockEntry],
        paginationMeta: { total: 1 },
      }),
      getAdlSummary: jest.fn().mockResolvedValue(mockSummary),
    };

    controller = new ClinicalAdlEntryController(adlEntryService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /clinical/adl-entries/individual/:individualId', () => {
    it('should list ADL trends for an individual', async () => {
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

    it('should pass date filters to service', async () => {
      const query = {
        date_from: '2026-03-01',
        date_to: '2026-03-31',
        adl_category_id: 'cat-uuid',
      };

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
          adl_category_id: 'cat-uuid',
        }),
        'org-uuid',
      );
    });
  });

  describe('GET /clinical/adl-entries/individual/:individualId/summary', () => {
    it('should return ADL summary for an individual', async () => {
      const result = await controller.summary('ind-uuid', 'org-uuid');

      expect(result.message).toBe('ADL summary retrieved');
      expect(result.data).toEqual(mockSummary);
      expect(adlEntryService.getAdlSummary).toHaveBeenCalledWith(
        'ind-uuid',
        'org-uuid',
      );
    });
  });
});
