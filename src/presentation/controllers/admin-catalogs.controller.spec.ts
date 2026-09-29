import { AdminCatalogsController } from './admin-catalogs.controller';
import type { AdminCreateSkillUseCase } from '../../application/use-cases/admin-create-skill.use-case';
import type { AdminListProgramsUseCase } from '../../application/use-cases/admin-list-programs.use-case';
import type { AdminListProjectCategoriesUseCase } from '../../application/use-cases/admin-list-project-categories.use-case';
import type { AdminListProjectTypesUseCase } from '../../application/use-cases/admin-list-project-types.use-case';
import type { AdminListSkillsUseCase } from '../../application/use-cases/admin-list-skills.use-case';
import type { AdminUpdateSkillUseCase } from '../../application/use-cases/admin-update-skill.use-case';
import type { CreateProgramUseCase } from '../../application/use-cases/create-program.use-case';
import type { CreateProjectCategoryUseCase } from '../../application/use-cases/create-project-category.use-case';
import type { CreateProjectTypeUseCase } from '../../application/use-cases/create-project-type.use-case';
import type { UpdateProgramUseCase } from '../../application/use-cases/update-program.use-case';
import type { UpdateProjectCategoryUseCase } from '../../application/use-cases/update-project-category.use-case';
import type { UpdateProjectTypeUseCase } from '../../application/use-cases/update-project-type.use-case';
import { createMock } from '../../testing/test-doubles.testing';

describe('AdminCatalogsController', () => {
  const adminListProgramsUseCase = createMock<AdminListProgramsUseCase>();
  const createProgramUseCase = createMock<CreateProgramUseCase>();
  const updateProgramUseCase = createMock<UpdateProgramUseCase>();
  const adminListProjectTypesUseCase =
    createMock<AdminListProjectTypesUseCase>();
  const createProjectTypeUseCase = createMock<CreateProjectTypeUseCase>();
  const updateProjectTypeUseCase = createMock<UpdateProjectTypeUseCase>();
  const adminListProjectCategoriesUseCase =
    createMock<AdminListProjectCategoriesUseCase>();
  const createProjectCategoryUseCase =
    createMock<CreateProjectCategoryUseCase>();
  const updateProjectCategoryUseCase =
    createMock<UpdateProjectCategoryUseCase>();
  const adminListSkillsUseCase = createMock<AdminListSkillsUseCase>();
  const adminCreateSkillUseCase = createMock<AdminCreateSkillUseCase>();
  const adminUpdateSkillUseCase = createMock<AdminUpdateSkillUseCase>();

  const controller = new AdminCatalogsController(
    adminListProgramsUseCase,
    createProgramUseCase,
    updateProgramUseCase,
    adminListProjectTypesUseCase,
    createProjectTypeUseCase,
    updateProjectTypeUseCase,
    adminListProjectCategoriesUseCase,
    createProjectCategoryUseCase,
    updateProjectCategoryUseCase,
    adminListSkillsUseCase,
    adminCreateSkillUseCase,
    adminUpdateSkillUseCase,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates programs routes to their use cases', () => {
    void controller.listPrograms();
    expect(adminListProgramsUseCase.execute).toHaveBeenCalledWith();

    const createDto = { code: 'ISI', name: 'Ingeniería de Sistemas' };
    void controller.createProgram(createDto);
    expect(createProgramUseCase.execute).toHaveBeenCalledWith(createDto);

    const updateDto = { active: false };
    void controller.updateProgram('program-1', updateDto);
    expect(updateProgramUseCase.execute).toHaveBeenCalledWith(
      'program-1',
      updateDto,
    );
  });

  it('delegates project type routes to their use cases', () => {
    void controller.listProjectTypes();
    expect(adminListProjectTypesUseCase.execute).toHaveBeenCalledWith();

    const createDto = { code: 'CURSO', name: 'Curso', templateFields: [] };
    void controller.createProjectType(createDto);
    expect(createProjectTypeUseCase.execute).toHaveBeenCalledWith(createDto);

    const updateDto = { active: false };
    void controller.updateProjectType('type-1', updateDto);
    expect(updateProjectTypeUseCase.execute).toHaveBeenCalledWith(
      'type-1',
      updateDto,
    );
  });

  it('delegates project category routes to their use cases', () => {
    void controller.listProjectCategories();
    expect(adminListProjectCategoriesUseCase.execute).toHaveBeenCalledWith();

    const createDto = { name: 'Desarrollo de software' };
    void controller.createProjectCategory(createDto);
    expect(createProjectCategoryUseCase.execute).toHaveBeenCalledWith(
      createDto,
    );

    const updateDto = { active: false };
    void controller.updateProjectCategory('category-1', updateDto);
    expect(updateProjectCategoryUseCase.execute).toHaveBeenCalledWith(
      'category-1',
      updateDto,
    );
  });

  it('delegates skill routes to their use cases', () => {
    const query = { page: 1, pageSize: 20 };
    void controller.listSkills(query);
    expect(adminListSkillsUseCase.execute).toHaveBeenCalledWith(query);

    const createDto = { name: 'Rust', type: 'CONOCIMIENTO' as const };
    void controller.createSkill(createDto);
    expect(adminCreateSkillUseCase.execute).toHaveBeenCalledWith(createDto);

    const updateDto = { status: 'ACTIVA' as const };
    void controller.updateSkill('skill-1', updateDto);
    expect(adminUpdateSkillUseCase.execute).toHaveBeenCalledWith(
      'skill-1',
      updateDto,
    );
  });
});
