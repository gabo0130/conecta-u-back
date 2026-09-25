import { CatalogsController } from './catalogs.controller';

function mockUseCase() {
  return { execute: jest.fn() };
}

describe('CatalogsController', () => {
  const listProgramsUseCase = mockUseCase();
  const searchSkillsUseCase = mockUseCase();
  const proposeSkillUseCase = mockUseCase();
  const listProjectTypesUseCase = mockUseCase();
  const listProjectCategoriesUseCase = mockUseCase();

  const controller = new CatalogsController(
    listProgramsUseCase as never,
    searchSkillsUseCase as never,
    proposeSkillUseCase as never,
    listProjectTypesUseCase as never,
    listProjectCategoriesUseCase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates listPrograms to use case', () => {
    void controller.listPrograms();
    expect(listProgramsUseCase.execute).toHaveBeenCalledWith();
  });

  it('delegates searchSkills to use case with query and type', () => {
    void controller.searchSkills('rea', 'CONOCIMIENTO');
    expect(searchSkillsUseCase.execute).toHaveBeenCalledWith(
      'rea',
      'CONOCIMIENTO',
    );
  });

  it('delegates proposeSkill to use case', () => {
    const dto = { name: 'Rust', type: 'CONOCIMIENTO' };
    void controller.proposeSkill(dto as never);
    expect(proposeSkillUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates listProjectTypes to use case', () => {
    void controller.listProjectTypes();
    expect(listProjectTypesUseCase.execute).toHaveBeenCalledWith();
  });

  it('delegates listProjectCategories to use case', () => {
    void controller.listProjectCategories();
    expect(listProjectCategoriesUseCase.execute).toHaveBeenCalledWith();
  });
});
