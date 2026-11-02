import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { NeedCharacterization } from '../../domain/entities/need';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { ProjectTypeEntity } from '../../domain/entities/project-type.entity';
import {
  buildNeed,
  buildSkill,
  createMock,
} from '../../testing/test-doubles.testing';
import { GetOpportunityDraftUseCase } from './get-opportunity-draft.use-case';

const characterization: NeedCharacterization = {
  problem: 'Los estudiantes no pueden reservar citas en línea.',
  objective: 'Ofrecer reservas en línea con recordatorios.',
  beneficiaries: 'Estudiantes',
  expectedResults: ['Plataforma web de reservas'],
  competencies: [{ skillId: 's1', name: 'React' }],
  unmatchedCompetencies: [],
  suggestedProjectTypeCode: 'INVESTIGACION',
  missingInformation: [],
  provider: 'fake',
  model: 'fake-1',
  promptVersion: 'v1',
};

describe('GetOpportunityDraftUseCase (T10)', () => {
  const needRepository = createMock<NeedRepository>();
  const skillRepository = createMock<SkillRepository>();
  const projectTypeRepository = createMock<ProjectTypeRepository>();
  const useCase = new GetOpportunityDraftUseCase(
    needRepository,
    skillRepository,
    projectTypeRepository,
  );
  const now = new Date('2026-11-02T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    skillRepository.findByIds.mockResolvedValue([
      buildSkill({ id: 's1', name: 'React' }),
    ]);
    projectTypeRepository.findAll.mockResolvedValue([
      new ProjectTypeEntity('t-curso', 'CURSO', 'Curso'),
      new ProjectTypeEntity('t-inv', 'INVESTIGACION', 'Investigación'),
    ]);
  });

  it('arma el borrador desde la caracterización', async () => {
    needRepository.findById.mockResolvedValue(
      buildNeed({
        status: 'CARACTERIZADA',
        characterization,
        dependency: 'Bienestar Universitario',
        deadline: '2027-05-02',
      }),
    );

    const draft = await useCase.execute('leader-1', 'need-1', now);

    expect(skillRepository.findByIds).toHaveBeenCalledWith(['s1']);
    expect(draft).toEqual({
      needId: 'need-1',
      title: 'Plataforma de citas de Bienestar',
      summary: characterization.problem,
      objectives: characterization.objective,
      executingEntity: 'Bienestar Universitario',
      durationMonths: 6,
      typeId: 't-inv',
      knownSkills: [
        {
          id: 's1',
          name: 'React',
          type: 'CONOCIMIENTO',
          category: 'FRAMEWORK',
        },
      ],
      deliverables: [
        {
          name: 'Plataforma web de reservas',
          scope:
            'Resultado esperado de la necesidad «Plataforma de citas de Bienestar».',
        },
      ],
    });
  });

  it('sin caracterizar usa la descripción y deja el resto vacío', async () => {
    needRepository.findById.mockResolvedValue(buildNeed());
    skillRepository.findByIds.mockResolvedValue([]);

    const draft = await useCase.execute('leader-1', 'need-1', now);

    expect(draft).toMatchObject({
      summary: buildNeed().description,
      objectives: '',
      executingEntity: null,
      durationMonths: null,
      typeId: null,
      knownSkills: [],
      deliverables: [],
    });
  });

  it('la duración queda entre 1 y 60 meses', async () => {
    needRepository.findById.mockResolvedValue(
      buildNeed({ deadline: '2026-11-10' }),
    );
    await expect(
      useCase.execute('leader-1', 'need-1', now),
    ).resolves.toMatchObject({ durationMonths: 1 });
    needRepository.findById.mockResolvedValue(
      buildNeed({ deadline: '2035-01-01' }),
    );
    await expect(
      useCase.execute('leader-1', 'need-1', now),
    ).resolves.toMatchObject({ durationMonths: 60 });
  });

  it('solo el formulador y con la necesidad abierta', async () => {
    needRepository.findById.mockResolvedValue(buildNeed());
    await expect(useCase.execute('otro', 'need-1', now)).rejects.toThrow(
      ForbiddenException,
    );
    needRepository.findById.mockResolvedValue(
      buildNeed({ status: 'CONVERTIDA' }),
    );
    await expect(useCase.execute('leader-1', 'need-1', now)).rejects.toThrow(
      ConflictException,
    );
  });
});
