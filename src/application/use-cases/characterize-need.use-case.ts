import {
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  CharacterizationInput,
  NeedCharacterizer,
} from '../../domain/repositories/need-characterizer.interface';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import {
  AnalyzerUnavailableError,
  InvalidAnalysisOutputError,
} from '../../domain/repositories/project-analyzer.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  ANALYSIS_TIMEOUTS,
  NEED_CHARACTERIZER,
  NEED_REPOSITORY,
  PROJECT_TYPE_REPOSITORY,
  SKILL_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { AppLoggerService } from '../../shared/logging/logger.service';
import type { AnalysisTimeouts } from '../analysis/analysis-timeouts';
import {
  OMITTED_PERSONAL_DATA,
  stripContactData,
} from '../analysis/contact-data';
import { SkillCatalogIndex } from '../analysis/skill-catalog-index';
import { toNeedResponse } from '../mappers/need-response.mapper';
import {
  parseCharacterization,
  type ParsedCharacterization,
} from '../needs/characterization-output.validator';
import { loadOpenOwnedNeed, NOT_FOUND } from '../support/need-access';

export const CHARACTERIZATION_UNAVAILABLE =
  'El servicio de caracterización no está disponible. Intenta de nuevo en unos minutos.';
export const CHARACTERIZATION_QUOTA_EXHAUSTED =
  'El servicio de caracterización alcanzó su límite de uso por hoy. Intenta de nuevo más tarde.';
export const CHARACTERIZATION_INVALID =
  'La IA devolvió una respuesta que no se pudo procesar. Intenta de nuevo.';
/** Con menos tiempo que esto no vale la pena reintentar una salida inválida. */
const MIN_RETRY_MS = 10_000;

const redact = (text: string) => stripContactData(text, OMITTED_PERSONAL_DATA);

/**
 * Tesis (T2): el formulador pide caracterizar su necesidad con IA. La respuesta se valida, se
 * empareja con el catálogo y se guarda; la necesidad pasa a CARACTERIZADA. Si la IA falla se
 * responde 503 y la necesidad queda como estaba.
 */
@Injectable()
export class CharacterizeNeedUseCase {
  private readonly logger: ReturnType<AppLoggerService['forContext']>;

  constructor(
    @Inject(NEED_REPOSITORY) private readonly needRepository: NeedRepository,
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
    @Inject(PROJECT_TYPE_REPOSITORY)
    private readonly projectTypeRepository: ProjectTypeRepository,
    @Inject(NEED_CHARACTERIZER)
    private readonly characterizer: NeedCharacterizer,
    @Inject(ANALYSIS_TIMEOUTS) private readonly timeouts: AnalysisTimeouts,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(CharacterizeNeedUseCase.name);
  }

  async execute(userId: string, needId: string) {
    const need = await loadOpenOwnedNeed(this.needRepository, userId, needId);
    if (!this.characterizer.isAvailable()) {
      throw new ServiceUnavailableException({
        message: CHARACTERIZATION_QUOTA_EXHAUSTED,
      });
    }
    const [skills, projectTypes] = await Promise.all([
      this.skillRepository.findAllActive(),
      this.projectTypeRepository.findAll(true),
    ]);
    const input: CharacterizationInput = {
      need: {
        title: redact(need.title),
        description: redact(need.description),
        kind: need.kind,
        dependency: need.dependency === null ? null : redact(need.dependency),
        hasDeadline: need.deadline !== null,
      },
      catalog: skills.map(({ name, type }) => ({ name, type })),
      projectTypes: projectTypes.map(({ code, name }) => ({ code, name })),
    };
    const context = {
      catalog: new SkillCatalogIndex(skills),
      projectTypeCodes: projectTypes.map((type) => type.code),
    };

    let parsed: ParsedCharacterization & { model: string };
    try {
      parsed = await this.characterizeWithRetry(input, context);
    } catch (error) {
      this.logger.error('La caracterización con IA falló', error, {
        method: 'execute',
        needId,
      });
      throw toHttpError(error);
    }

    const updated = await this.needRepository.update(need.id, {
      characterization: {
        ...parsed,
        provider: this.characterizer.provider,
        promptVersion: this.characterizer.promptVersion,
      },
      characterizedAt: new Date(),
      status: 'CARACTERIZADA',
    });
    if (!updated) throw new NotFoundException({ message: NOT_FOUND });
    return toNeedResponse(updated);
  }

  /** Un reintento si la salida no cumple el esquema y queda tiempo, igual que el análisis. */
  private async characterizeWithRetry(
    input: CharacterizationInput,
    context: Parameters<typeof parseCharacterization>[1],
  ): Promise<ParsedCharacterization & { model: string }> {
    const deadline = Date.now() + this.timeouts.totalMs;
    for (let attempt = 1; ; attempt++) {
      const response = await this.characterizer.characterize(input, {
        timeoutMs: Math.max(deadline - Date.now(), 1),
      });
      try {
        return {
          ...parseCharacterization(response.output, context),
          model: response.model ?? this.characterizer.model,
        };
      } catch (error) {
        const retryable =
          error instanceof InvalidAnalysisOutputError &&
          attempt === 1 &&
          deadline - Date.now() >= MIN_RETRY_MS;
        if (!retryable) throw error;
        this.logger.warn('Salida de la IA inválida: se reintenta una vez', {
          method: 'characterizeWithRetry',
          reason: error.message,
        });
      }
    }
  }
}

function toHttpError(error: unknown): unknown {
  if (error instanceof HttpException) return error;
  if (error instanceof AnalyzerUnavailableError) {
    return new ServiceUnavailableException({
      message: CHARACTERIZATION_UNAVAILABLE,
    });
  }
  if (error instanceof InvalidAnalysisOutputError) {
    return new ServiceUnavailableException({
      message: CHARACTERIZATION_INVALID,
    });
  }
  return error;
}
