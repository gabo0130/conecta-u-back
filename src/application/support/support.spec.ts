import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  assertSkillsExist,
  findProgramOrFail,
  findProjectCategoryOrFail,
  findProjectTypeOrFail,
} from './catalog-references';
import { assertValidExperiencePeriod } from './experience-period';
import { findMyCollaboratorOrFail } from './my-collaborator';
import { assertValidTypeData } from './project-references';
import { resolveOrProposeSkill } from './skill-resolver';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  buildCollaborator,
  buildProgram,
  buildProjectCategory,
  buildProjectType,
  buildSkill,
  createMock,
} from '../../testing/test-doubles.testing';

describe('catalog references', () => {
  const programRepository = createMock<ProgramRepository>();
  const projectTypeRepository = createMock<ProjectTypeRepository>();
  const projectCategoryRepository = createMock<ProjectCategoryRepository>();
  const skillRepository = createMock<SkillRepository>();

  beforeEach(() => jest.clearAllMocks());

  it('returns active catalog entries', async () => {
    programRepository.findById.mockResolvedValue(buildProgram());
    projectTypeRepository.findById.mockResolvedValue(buildProjectType());
    projectCategoryRepository.findById.mockResolvedValue(
      buildProjectCategory(),
    );

    await expect(
      findProgramOrFail(programRepository, 'program-1'),
    ).resolves.toEqual(buildProgram());
    await expect(
      findProjectTypeOrFail(projectTypeRepository, 'type-1'),
    ).resolves.toEqual(buildProjectType());
    await expect(
      findProjectCategoryOrFail(projectCategoryRepository, 'category-1'),
    ).resolves.toEqual(buildProjectCategory());
  });

  it('treats inactive entries as not found', async () => {
    programRepository.findById.mockResolvedValue(
      buildProgram({ active: false }),
    );
    projectCategoryRepository.findById.mockResolvedValue(
      buildProjectCategory({ active: false }),
    );

    await expect(
      findProgramOrFail(programRepository, 'program-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      findProjectCategoryOrFail(projectCategoryRepository, 'category-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('checks every distinct skill id exists', async () => {
    skillRepository.findByIds.mockResolvedValue([buildSkill()]);

    await expect(
      assertSkillsExist(skillRepository, ['skill-1', 'skill-1']),
    ).resolves.toBeUndefined();
    expect(skillRepository.findByIds).toHaveBeenCalledWith(['skill-1']);

    await expect(
      assertSkillsExist(skillRepository, ['skill-1', 'ghost']),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('skips the query when there are no skill ids', async () => {
    await assertSkillsExist(skillRepository, undefined);
    await assertSkillsExist(skillRepository, []);

    expect(skillRepository.findByIds).not.toHaveBeenCalled();
  });
});

describe('findMyCollaboratorOrFail', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();

  it('returns the profile of the user or throws 404', async () => {
    collaboratorRepository.findByUserId.mockResolvedValueOnce(
      buildCollaborator(),
    );
    await expect(
      findMyCollaboratorOrFail(collaboratorRepository, 'user-1'),
    ).resolves.toEqual(buildCollaborator());

    collaboratorRepository.findByUserId.mockResolvedValueOnce(null);
    await expect(
      findMyCollaboratorOrFail(collaboratorRepository, 'user-1'),
    ).rejects.toThrow('Perfil de colaborador no encontrado');
  });
});

describe('request validation helpers', () => {
  it('turns an invalid experience period into a 400', () => {
    expect(() =>
      assertValidExperiencePeriod({
        startDate: '2024-06-01',
        endDate: '2024-01-01',
        current: false,
      }),
    ).toThrow(BadRequestException);
  });

  it('turns the first typeData error into a 400', () => {
    expect(() => assertValidTypeData(buildProjectType(), {})).toThrow(
      'Falta el campo obligatorio: Asignatura',
    );
    expect(() =>
      assertValidTypeData(buildProjectType(), { asignatura: 'Cálculo' }),
    ).not.toThrow();
  });
});

describe('resolveOrProposeSkill', () => {
  const skillRepository = createMock<SkillRepository>();

  beforeEach(() => jest.clearAllMocks());

  it('reuses a skill found by canonical name or synonym', async () => {
    skillRepository.findByNormalizedNameOrSynonym.mockResolvedValue(
      buildSkill(),
    );

    const result = await resolveOrProposeSkill(skillRepository, {
      name: 'React.js',
      type: 'CONOCIMIENTO',
    });

    expect(skillRepository.findByNormalizedNameOrSynonym).toHaveBeenCalledWith(
      'reactjs',
    );
    expect(result).toEqual({ skill: buildSkill(), proposed: false });
  });

  it('proposes an unknown skill as PENDIENTE', async () => {
    skillRepository.findByNormalizedNameOrSynonym.mockResolvedValue(null);
    skillRepository.create.mockResolvedValue(buildSkill({ name: 'Rust' }));

    const result = await resolveOrProposeSkill(skillRepository, {
      name: ' Rust ',
      type: 'CONOCIMIENTO',
      category: 'LENGUAJE',
    });

    expect(skillRepository.create).toHaveBeenCalledWith({
      name: 'Rust',
      normalizedName: 'rust',
      type: 'CONOCIMIENTO',
      category: 'LENGUAJE',
      status: 'PENDIENTE',
    });
    expect(result.proposed).toBe(true);
  });
});
