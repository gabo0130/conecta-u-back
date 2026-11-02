import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import type { NeedCharacterizer } from '../../domain/repositories/need-characterizer.interface';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import {
  AnalyzerUnavailableError,
  type AnalyzerResponse,
} from '../../domain/repositories/project-analyzer.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import type { AppLoggerService } from '../../shared/logging/logger.service';
import {
  buildNeed,
  buildProjectType,
  buildSkill,
  createMock,
} from '../../testing/test-doubles.testing';
import {
  CHARACTERIZATION_INVALID,
  CHARACTERIZATION_QUOTA_EXHAUSTED,
  CHARACTERIZATION_UNAVAILABLE,
  CharacterizeNeedUseCase,
} from './characterize-need.use-case';

const response = (output: unknown): AnalyzerResponse => ({
  output,
  usage: { inputTokens: null, outputTokens: null },
});

describe('CharacterizeNeedUseCase (T2)', () => {
  const needRepository = createMock<NeedRepository>();
  const skillRepository = createMock<SkillRepository>();
  const projectTypeRepository = createMock<ProjectTypeRepository>();
  const characterizer = Object.assign(createMock<NeedCharacterizer>(), {
    provider: 'fake',
    model: 'fake-1',
    promptVersion: 'v1',
  });
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const appLogger = { forContext: () => logger } as unknown as AppLoggerService;
  const useCase = new CharacterizeNeedUseCase(
    needRepository,
    skillRepository,
    projectTypeRepository,
    characterizer,
    { totalMs: 55_000, embeddingMs: 10_000, staleAfterMs: 115_000 },
    appLogger,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    needRepository.findById.mockResolvedValue(
      buildNeed({
        description:
          'Escríbanme a ana@ufps.edu.co: necesitamos una plataforma en React para los estudiantes.',
      }),
    );
    needRepository.update.mockImplementation((id, changes) =>
      Promise.resolve(buildNeed({ ...changes })),
    );
    skillRepository.findAllActive.mockResolvedValue([
      buildSkill({ id: 's1', name: 'React' }),
    ]);
    projectTypeRepository.findAll.mockResolvedValue([buildProjectType()]);
    characterizer.isAvailable.mockReturnValue(true);
  });

  it('guarda la caracterización validada y pasa la necesidad a CARACTERIZADA', async () => {
    characterizer.characterize.mockResolvedValue(
      response({
        problema: 'Los estudiantes no tienen dónde reservar.',
        competencias: ['react'],
        tipoProyectoSugerido: 'CURSO',
      }),
    );

    const result = await useCase.execute('leader-1', 'need-1');

    const [input] = characterizer.characterize.mock.calls[0];
    expect(input.need.description).not.toContain('ana@ufps.edu.co');
    expect(input.need.description).toContain('[dato personal omitido]');
    expect(input.catalog).toEqual([{ name: 'React', type: 'CONOCIMIENTO' }]);
    expect(needRepository.update).toHaveBeenCalledWith(
      'need-1',
      expect.objectContaining({
        status: 'CARACTERIZADA',
        characterizedAt: expect.any(Date),
      }),
    );
    expect(result.characterization).toMatchObject({
      competencies: [{ skillId: 's1', name: 'React' }],
      suggestedProjectTypeCode: 'CURSO',
      provider: 'fake',
      model: 'fake-1',
      promptVersion: 'v1',
    });
  });

  it('reintenta una vez si la salida no cumple el esquema', async () => {
    characterizer.characterize
      .mockResolvedValueOnce(response({}))
      .mockResolvedValueOnce(response({ problema: 'Problema' }));
    await expect(useCase.execute('leader-1', 'need-1')).resolves.toBeDefined();
    expect(characterizer.characterize).toHaveBeenCalledTimes(2);
  });

  it('503 si la salida sigue siendo inválida; la necesidad no cambia', async () => {
    characterizer.characterize.mockResolvedValue(response({}));
    await expect(useCase.execute('leader-1', 'need-1')).rejects.toThrow(
      new ServiceUnavailableException({ message: CHARACTERIZATION_INVALID }),
    );
    expect(needRepository.update).not.toHaveBeenCalled();
  });

  it('503 si la IA no responde', async () => {
    characterizer.characterize.mockRejectedValue(
      new AnalyzerUnavailableError('timeout'),
    );
    await expect(useCase.execute('leader-1', 'need-1')).rejects.toThrow(
      new ServiceUnavailableException({
        message: CHARACTERIZATION_UNAVAILABLE,
      }),
    );
  });

  it('503 sin llamar si la cuota diaria está agotada', async () => {
    characterizer.isAvailable.mockReturnValue(false);
    await expect(useCase.execute('leader-1', 'need-1')).rejects.toThrow(
      new ServiceUnavailableException({
        message: CHARACTERIZATION_QUOTA_EXHAUSTED,
      }),
    );
    expect(characterizer.characterize).not.toHaveBeenCalled();
  });

  it('409 si la necesidad ya se convirtió', async () => {
    needRepository.findById.mockResolvedValue(
      buildNeed({ status: 'CONVERTIDA' }),
    );
    await expect(useCase.execute('leader-1', 'need-1')).rejects.toThrow(
      ConflictException,
    );
  });
});
