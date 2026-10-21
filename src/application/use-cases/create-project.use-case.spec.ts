import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateProjectUseCase } from './create-project.use-case';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import type { CreateProjectDto } from '../dto/create-project.dto';
import {
  buildProgram,
  buildProject,
  buildProjectCategory,
  buildProjectType,
  buildSkill,
  buildUser,
  createMock,
} from '../../testing/test-doubles.testing';

describe('CreateProjectUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();
  const projectTypeRepository = createMock<ProjectTypeRepository>();
  const projectCategoryRepository = createMock<ProjectCategoryRepository>();
  const programRepository = createMock<ProgramRepository>();
  const skillRepository = createMock<SkillRepository>();
  const userRepository = createMock<UserRepository>();
  const useCase = new CreateProjectUseCase(
    projectRepository,
    projectTypeRepository,
    projectCategoryRepository,
    programRepository,
    skillRepository,
    userRepository,
  );
  const leader = { userId: 'leader-1', role: 'LIDER' as const };
  const admin = { userId: 'admin-1', role: 'ADMIN' as const };

  const dto: CreateProjectDto = {
    title: 'Conecta U',
    summary: 'Resumen',
    objectives: 'Objetivos',
    typeId: 'type-1',
    categoryId: 'category-1',
    programId: 'program-1',
    typeData: { asignatura: 'Seminario III' },
    knownSkillIds: ['skill-1'],
    deliverables: [{ name: 'PMV', scope: 'Iteración 1' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    projectTypeRepository.findById.mockResolvedValue(buildProjectType());
    projectCategoryRepository.findById.mockResolvedValue(
      buildProjectCategory(),
    );
    programRepository.findById.mockResolvedValue(buildProgram());
    skillRepository.findByIds.mockResolvedValue([buildSkill()]);
    projectRepository.create.mockResolvedValue(buildProject());
  });

  it('creates the project after validating every catalog reference', async () => {
    const result = await useCase.execute(leader, dto);

    expect(projectRepository.create).toHaveBeenCalledWith({
      ...dto,
      leaderId: 'leader-1',
      createdById: 'leader-1',
    });
    expect(result.status).toBe('BORRADOR');
  });

  it('defaults typeData and programId when they are omitted', async () => {
    projectTypeRepository.findById.mockResolvedValue(
      buildProjectType({ templateFields: [] }),
    );

    await useCase.execute(leader, {
      ...dto,
      typeData: undefined,
      programId: undefined,
    });

    expect(programRepository.findById).not.toHaveBeenCalled();
    expect(projectRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ typeData: {}, programId: null }),
    );
  });

  it.each([
    ['type', () => projectTypeRepository.findById.mockResolvedValue(null)],
    [
      'inactive type',
      () =>
        projectTypeRepository.findById.mockResolvedValue(
          buildProjectType({ active: false }),
        ),
    ],
    [
      'category',
      () => projectCategoryRepository.findById.mockResolvedValue(null),
    ],
    ['program', () => programRepository.findById.mockResolvedValue(null)],
    ['known skill', () => skillRepository.findByIds.mockResolvedValue([])],
  ])('rejects a missing %s with 404', async (_label, arrange) => {
    arrange();

    await expect(useCase.execute(leader, dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(projectRepository.create).not.toHaveBeenCalled();
  });

  it('rejects typeData that does not match the type template', async () => {
    await expect(
      useCase.execute(leader, { ...dto, typeData: {} }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('ADMIN registra a nombre de un líder (v2.1, A5)', () => {
    it('creates the project for the chosen active leader and records the admin as author', async () => {
      userRepository.findById.mockResolvedValue(
        buildUser({ id: 'leader-9', role: 'LIDER' }),
      );

      await useCase.execute(admin, { ...dto, leaderId: 'leader-9' });

      expect(projectRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          leaderId: 'leader-9',
          createdById: 'admin-1',
        }),
      );
    });

    it('ignores leaderId when a LIDER registers: the project is always theirs', async () => {
      await useCase.execute(leader, { ...dto, leaderId: 'someone-else' });

      expect(userRepository.findById).not.toHaveBeenCalled();
      expect(projectRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ leaderId: 'leader-1' }),
      );
    });

    it.each([
      ['no leader is chosen', undefined, null],
      ['the leader does not exist', 'ghost', null],
      [
        'the user is not a LIDER',
        'u-1',
        buildUser({ id: 'u-1', role: 'COLABORADOR' }),
      ],
      [
        'the leader is inactive',
        'u-2',
        buildUser({ id: 'u-2', role: 'LIDER', active: false }),
      ],
    ])('422 when %s', async (_case, leaderId, found) => {
      userRepository.findById.mockResolvedValue(found);

      await expect(
        useCase.execute(admin, { ...dto, leaderId }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(projectRepository.create).not.toHaveBeenCalled();
    });
  });
});
