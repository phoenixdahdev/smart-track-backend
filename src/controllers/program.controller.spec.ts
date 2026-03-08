import { ProgramController } from './program.controller';
import { ProgramService } from '@services/program.service';

describe('ProgramController', () => {
  let controller: ProgramController;
  let programService: {
    list: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };

  const mockProgram = {
    id: 'prog-uuid',
    org_id: 'org-uuid',
    name: 'Residential Support',
    type: 'RESIDENTIAL',
    active: true,
  };

  beforeEach(() => {
    programService = {
      list: jest.fn().mockResolvedValue({
        payload: [mockProgram],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockProgram),
      findById: jest.fn().mockResolvedValue(mockProgram),
      update: jest.fn().mockResolvedValue(mockProgram),
    };

    controller = new ProgramController(
      programService as unknown as ProgramService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/programs', () => {
    it('should list programs', async () => {
      const result = await controller.list('org-uuid', {});
      expect(result.message).toBe('Programs retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('POST /admin/programs', () => {
    it('should create program', async () => {
      const result = await controller.create(
        { name: 'Residential Support' },
        'org-uuid',
      );
      expect(result.message).toBe('Program created');
      expect(result.data.id).toBe('prog-uuid');
    });
  });

  describe('GET /admin/programs/:id', () => {
    it('should get program by id', async () => {
      const result = await controller.findById('prog-uuid', 'org-uuid');
      expect(result.message).toBe('Program retrieved');
      expect(result.data.name).toBe('Residential Support');
    });
  });

  describe('PATCH /admin/programs/:id', () => {
    it('should update program', async () => {
      const result = await controller.update('prog-uuid', 'org-uuid', {
        name: 'Community Living',
      });
      expect(result.message).toBe('Program updated');
    });
  });
});
