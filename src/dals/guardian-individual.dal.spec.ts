import { GuardianIndividualDal } from './guardian-individual.dal';

describe('GuardianIndividualDal', () => {
  let dal: GuardianIndividualDal;
  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    metadata: {
      target: class GuardianIndividualEntity {},
      columns: [],
      relations: [],
    },
  };

  beforeEach(() => {
    dal = new GuardianIndividualDal(mockRepository as never);
  });

  it('should be defined', () => {
    expect(dal).toBeDefined();
  });

  it('should extend AbstractModelAction', () => {
    expect(dal).toHaveProperty('get');
    expect(dal).toHaveProperty('find');
    expect(dal).toHaveProperty('create');
  });
});
