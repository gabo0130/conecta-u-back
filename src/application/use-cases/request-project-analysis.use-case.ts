import {
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MAX_ANALYSES_PER_DAY } from '../../domain/entities/analysis-limits';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import type {
  NewRequiredProfile,
  ProjectAnalysisRepository,
} from '../../domain/repositories/project-analysis.repository.interface';
import {
  AnalyzerUnavailableError,
  InvalidAnalysisOutputError,
} from '../../domain/repositories/project-analyzer.interface';
import type {
  AnalysisInput,
  AnalysisOutput,
  ProjectAnalyzer,
} from '../../domain/repositories/project-analyzer.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import {
  ANALYSIS_TIMEOUTS,
  PROJECT_ANALYSIS_REPOSITORY,
  PROJECT_ANALYZER,
  PROJECT_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { AppLoggerService } from '../../shared/logging/logger.service';
import { AnalysisInputBuilder } from '../analysis/analysis-input.builder';
import { parseAnalysisOutput } from '../analysis/analysis-output.validator';
import { AnalysisRecoveryService } from '../analysis/analysis-recovery.service';
import type { AnalysisTimeouts } from '../analysis/analysis-timeouts';
import { mapProfilesToCatalog } from '../analysis/catalog-profile-mapper';
import { ProfileEmbedder } from '../analysis/profile-embedder';
import { toProjectAnalysisResponse } from '../mappers/analysis-response.mapper';
import { loadOwnedProject } from '../support/project-access';

const DAY_MS = 24 * 60 * 60 * 1000;
const UNAVAILABLE_MESSAGE =
  'El servicio de análisis no está disponible. Intenta de nuevo en unos minutos.';
const QUOTA_EXHAUSTED_MESSAGE =
  'El servicio de análisis alcanzó su límite de uso por hoy. Intenta de nuevo más tarde.';
const INVALID_OUTPUT_MESSAGE =
  'La IA devolvió una respuesta que no se pudo procesar. Intenta de nuevo.';
const ABANDONED_MESSAGE =
  'El análisis tardó demasiado y se canceló. Intenta de nuevo.';
/** Con menos tiempo que esto no vale la pena reintentar una salida inválida. */
const MIN_RETRY_MS = 10_000;
/** Con menos tiempo que esto se guardan los perfiles sin embedding (son opcionales). */
const MIN_EMBEDDING_MS = 1_000;

interface AnalyzedResult {
  /** Modelo que respondió, solo si no fue el configurado. */
  model?: string;
  output: AnalysisOutput;
  rawOutput: unknown;
  inputTokens: number | null;
  outputTokens: number | null;
}

/**
 * RF12: el líder dueño pide el análisis de su proyecto con IA. Guarda el análisis y sus
 * perfiles (RF13–RF14); si la IA falla, el análisis queda en ERROR y el proyecto vuelve a
 * su estado anterior.
 */
@Injectable()
export class RequestProjectAnalysisUseCase {
  private readonly logger: ReturnType<AppLoggerService['forContext']>;

  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_ANALYSIS_REPOSITORY)
    private readonly analysisRepository: ProjectAnalysisRepository,
    @Inject(PROJECT_ANALYZER) private readonly analyzer: ProjectAnalyzer,
    @Inject(ANALYSIS_TIMEOUTS) private readonly timeouts: AnalysisTimeouts,
    private readonly profileEmbedder: ProfileEmbedder,
    private readonly inputBuilder: AnalysisInputBuilder,
    private readonly recovery: AnalysisRecoveryService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(RequestProjectAnalysisUseCase.name);
  }

  async execute(userId: string, projectId: string) {
    const project = await loadOwnedProject(
      this.projectRepository,
      userId,
      projectId,
    );
    assertAnalyzable(project);
    // Cuota diaria agotada: se responde sin crear un intento que gaste el límite del proyecto.
    if (!this.analyzer.isAvailable()) {
      throw new ServiceUnavailableException({
        message: QUOTA_EXHAUSTED_MESSAGE,
      });
    }

    const { input, catalog, fingerprint } =
      await this.inputBuilder.build(project);
    const now = Date.now();
    // Un análisis interrumpido de este proyecto no debe bloquear el nuevo.
    await this.recovery.recover(projectId);
    const claim = await this.analysisRepository.claim(
      {
        projectId,
        requestedById: userId,
        provider: this.analyzer.provider,
        model: this.analyzer.model,
        promptVersion: this.analyzer.promptVersion,
        input: { ...input, fingerprint },
      },
      {
        dailySince: new Date(now - DAY_MS),
        maxPerDay: MAX_ANALYSES_PER_DAY,
      },
    );
    if (claim.status === 'IN_PROGRESS') {
      throw new ConflictException({
        message: 'Ya hay un análisis en curso para este proyecto.',
      });
    }
    if (claim.status === 'DAILY_LIMIT') {
      throw new ConflictException({
        message: `Alcanzaste el máximo de ${MAX_ANALYSES_PER_DAY} análisis por día para este proyecto. Intenta de nuevo mañana.`,
      });
    }

    const analysisId = claim.analysis.id;
    const startedAt = Date.now();
    // Un solo presupuesto para la IA, su reintento y los embeddings.
    const deadline = startedAt + this.timeouts.totalMs;
    try {
      await this.projectRepository.update(projectId, { status: 'EN_ANALISIS' });
      const result = await this.analyzeWithRetry(input, deadline);
      const profiles = await this.withEmbeddings(
        mapProfilesToCatalog(result.output.profiles, catalog),
        deadline,
      );
      // Guarda el análisis, sus perfiles y el paso del proyecto a ANALIZADO en un solo paso.
      const completed = await this.analysisRepository.complete(analysisId, {
        model: result.model,
        rawOutput: result.rawOutput,
        summary: result.output.summary,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        durationMs: Date.now() - startedAt,
        profiles,
      });
      if (!completed) {
        throw new ServiceUnavailableException({ message: ABANDONED_MESSAGE });
      }
      return toProjectAnalysisResponse(
        completed.analysis,
        completed.profiles,
        false,
      );
    } catch (error) {
      await this.recordFailure(analysisId, error, startedAt);
      throw toHttpError(error);
    }
  }

  /**
   * Un reintento si la salida del modelo no cumple el esquema y queda tiempo; si falla otra
   * vez, se rinde. Cada llamada recibe solo lo que le queda al presupuesto.
   */
  private async analyzeWithRetry(
    input: AnalysisInput,
    deadline: number,
  ): Promise<AnalyzedResult> {
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    const add = (current: number | null, extra: number | null) =>
      current === null && extra === null ? null : (current ?? 0) + (extra ?? 0);

    for (let attempt = 1; ; attempt++) {
      const response = await this.analyzer.analyze(input, {
        timeoutMs: Math.max(deadline - Date.now(), 1),
      });
      inputTokens = add(inputTokens, response.usage.inputTokens);
      outputTokens = add(outputTokens, response.usage.outputTokens);
      try {
        return {
          model: response.model,
          output: parseAnalysisOutput(response.output),
          rawOutput: response.output,
          inputTokens,
          outputTokens,
        };
      } catch (error) {
        const retryable =
          error instanceof InvalidAnalysisOutputError &&
          attempt < 2 &&
          deadline - Date.now() >= MIN_RETRY_MS;
        if (!retryable) throw error;
        this.logger.warn('Salida de la IA inválida: se reintenta una vez', {
          method: 'analyzeWithRetry',
          reason: error.message,
        });
      }
    }
  }

  /**
   * La parte semántica es opcional: si no hay embeddings, el matchmaking reparte su peso.
   * Usa su propio tope de tiempo y nunca pasa el presupuesto del análisis.
   */
  private async withEmbeddings(
    profiles: NewRequiredProfile[],
    deadline: number,
  ): Promise<NewRequiredProfile[]> {
    const remaining = deadline - Date.now();
    if (remaining < MIN_EMBEDDING_MS) {
      this.logger.warn('Sin tiempo para los embeddings: se guardan sin ellos', {
        method: 'withEmbeddings',
      });
      return profiles;
    }
    const embeddings = await this.profileEmbedder.embed(profiles, {
      timeoutMs: Math.min(remaining, this.timeouts.embeddingMs),
    });
    return profiles.map((profile, index) => ({
      ...profile,
      embedding: embeddings[index],
    }));
  }

  private async recordFailure(
    analysisId: string,
    error: unknown,
    startedAt: number,
  ): Promise<void> {
    // El detalle técnico va al log; en la base y en las respuestas solo un mensaje seguro.
    this.logger.error('El análisis con IA falló', error, {
      method: 'execute',
      analysisId,
    });
    try {
      // El repositorio también devuelve el proyecto a su estado; si el análisis ya no estaba
      // PENDIENTE, la recuperación lo cerró antes y no se escribe nada.
      await this.analysisRepository.fail(
        analysisId,
        failureMessage(error),
        Date.now() - startedAt,
      );
    } catch (cleanupError) {
      this.logger.error(
        'No se pudo registrar el fallo del análisis',
        cleanupError,
        { method: 'recordFailure', analysisId },
      );
    }
  }
}

/** RF12: el proyecto debe tener lo mínimo para que la IA tenga de qué partir. */
function assertAnalyzable(project: ProjectEntity): void {
  if (
    !project.title.trim() ||
    !project.summary.trim() ||
    !project.objectives.trim()
  ) {
    throw new UnprocessableEntityException({
      message:
        'El proyecto necesita título, resumen y objetivos para poder analizarse.',
    });
  }
}

function failureMessage(error: unknown): string {
  if (error instanceof AnalyzerUnavailableError) return UNAVAILABLE_MESSAGE;
  if (error instanceof InvalidAnalysisOutputError)
    return INVALID_OUTPUT_MESSAGE;
  return 'Ocurrió un error inesperado durante el análisis.';
}

function toHttpError(error: unknown): unknown {
  if (error instanceof HttpException) return error;
  if (error instanceof AnalyzerUnavailableError) {
    return new ServiceUnavailableException({ message: UNAVAILABLE_MESSAGE });
  }
  if (error instanceof InvalidAnalysisOutputError) {
    return new ServiceUnavailableException({ message: INVALID_OUTPUT_MESSAGE });
  }
  return error;
}
