import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateProjectUseCase } from './update-project.use-case';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  buildProgram,
  buildProject,
  buildProjectCategory,
  buildProjectType,
  buildSkill,
  createMock,
} from '../../testing/test-doubles.testing';

describe('UpdateProjectUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();
  const projectTypeRepository = createMock<ProjectTypeRepository>();
  const projectCategoryRepository = createMock<ProjectCategoryRepository>();
  const programRepository = createMock<ProgramRepository>();
  const skillRepository = createMock<SkillRepository>();
  const useCase = new UpdateProjectUseCase(
    projectRepository,
    projectTypeRepository,
    projectCategoryRepository,
    programRepository,
    skillRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    projectRepository.findById.mockResolvedValue(buildProject());
    projectRepository.update.mockResolvedValue(
      buildProject({ title: 'Nuevo' }),
    );
    projectTypeRepository.findById.mockResolvedValue(buildProjectType());
    projectCategoryRepository.findById.mockResolvedValue(
      buildProjectCategory(),
    );
    programRepository.findById.mockResolvedValue(buildProgram());
    skillRepository.findByIds.mockResolvedValue([buildSkill()]);
  });

  it('updates only the fields sent, without revalidating untouched references', async () => {
    const result = await useCase.execute('leader-1', 'project-1', {
      title: 'Nuevo',
    });

    expect(projectRepository.update).toHaveBeenCalledWith('project-1', {
      title: 'Nuevo',
    });
    expect(projectTypeRepository.findById).not.toHaveBeenCalled();
    expect(projectCategoryRepository.findById).not.toHaveBeenCalled();
    expect(result.title).toBe('Nuevo');
  });

  it('validates every reference that changes', async () => {
    await useCase.execute('leader-1', 'project-1', {
      categoryId: 'category-2',
      programId: 'program-2',
      knownSkillIds: ['skill-1'],
      typeData: { asignatura: 'Bases de datos' },
      deliverables: [{ name: 'PMV', scope: 'Iteración 1' }],
    });

    expect(projectTypeRepository.findById).toHaveBeenCalledWith('type-1');
    expect(projectCategoryRepository.findById).toHaveBeenCalledWith(
      'category-2',
    );
    expect(programRepository.findById).toHaveBeenCalledWith('program-2');
    expect(skillRepository.findByIds).toHaveBeenCalledWith(['skill-1']);
  });

  it('revalidates the current typeData against a new type', async () => {
    projectTypeRepository.findById.mockResolvedValue(
      buildProjectType({
        id: 'type-2',
        templateFields: [
          { key: 'entidad', label: 'Entidad', kind: 'text', required: true },
        ],
      }),
    );

    await expect(
      useCase.execute('leader-1', 'project-1', { typeId: 'type-2' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(projectRepository.update).not.toHaveBeenCalled();
  });

  it('rejects a category that does not exist', async () => {
    projectCategoryRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('leader-1', 'project-1', { categoryId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when the project does not exist', async () => {
    projectRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('leader-1', 'missing', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException when the project belongs to another leader', async () => {
    await expect(
      useCase.execute('other-leader', 'project-1', { title: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFoundException when the project disappears while updating', async () => {
    projectRepository.update.mockResolvedValue(null);

    await expect(
      useCase.execute('leader-1', 'project-1', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
