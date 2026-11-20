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
import type { SkillEntity } from '../../domain/entities/skill.entity';
import type {
  NewRequiredProfile,
  ProjectAnalysisRepository,
} from '../../domain/repositories/project-analysis.repository.interface';
import {
  AnalyzerUnavailableError,
  InvalidAnalysisOutputError,
  TruncatedAnalysisOutputError,
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
import type { RequestAnalysisDto } from '../dto/request-analysis.dto';
import { AnalysisUsageMeter } from '../analysis/analysis-usage-meter';
import { parseAnalysisOutput } from '../analysis/analysis-output.validator';
import { AnalysisRecoveryService } from '../analysis/analysis-recovery.service';
import type { AnalysisTimeouts } from '../analysis/analysis-timeouts';
import {
  mapProfilesToCatalog,
  profilesWithoutSoftSkill,
} from '../analysis/catalog-profile-mapper';
import {
  ProfileEmbedder,
  toEmbeddableNewProfile,
} from '../analysis/profile-embedder';
import { toAnalysisSummary } from '../mappers/analysis-response.mapper';
import type { Actor } from '../support/project-access';
import { loadProjectForAnalysis } from '../support/project-access';

const DAY_MS = 24 * 60 * 60 * 1000;
const UNAVAILABLE_MESSAGE =
  'El servicio de análisis no está disponible. Intenta de nuevo en unos minutos.';
const QUOTA_EXHAUSTED_MESSAGE =
  'El servicio de análisis alcanzó su límite de uso por hoy. Intenta de nuevo más tarde.';
const INVALID_OUTPUT_MESSAGE =
  'La IA devolvió una respuesta que no se pudo procesar. Intenta de nuevo.';
const UNCHANGED_MESSAGE =
  'El proyecto no cambió desde el último análisis. Si quieres otra propuesta, confirma que deseas analizarlo de nuevo.';
const ABANDONED_MESSAGE =
  'El análisis tardó demasiado y se canceló. Intenta de nuevo.';
/** Con menos tiempo que esto no vale la pena reintentar una salida inválida. */
const MIN_RETRY_MS = 10_000;
/** Con menos tiempo que esto se guardan los perfiles sin embedding (son opcionales). */
const MIN_EMBEDDING_MS = 1_000;

interface AnalyzedResult {
  /** Proveedor y modelo que respondieron, solo si no fueron los configurados. */
  provider?: string;
  model?: string;
  output: AnalysisOutput;
  rawOutput: unknown;
}

/**
 * RF6: el líder dueño (o el ADMIN) pide el análisis del proyecto con IA. La petición solo valida, reserva
 * el turno y responde de inmediato con el análisis PENDIENTE (202): la IA corre en segundo plano
 * y el resultado queda en la base (perfiles requeridos RF7, o ERROR y el proyecto vuelve a su estado).
 * Así el análisis no depende de que el navegador, la red del usuario o un proxy esperen minutos;
 * el front consulta el intento hasta que termina. Si el servidor se reinicia a mitad,
 * `AnalysisRecoveryService` lo cierra.
 */
@Injectable()
export class RequestProjectAnalysisUseCase {
  private readonly logger: ReturnType<AppLoggerService['forContext']>;
  /** Análisis corriendo en segundo plano en este proceso. */
  private readonly running = new Set<Promise<void>>();

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

  async execute(
    actor: Actor,
    projectId: string,
    { force = false }: RequestAnalysisDto = {},
  ) {
    const project = await loadProjectForAnalysis(
      this.projectRepository,
      actor,
      projectId,
    );
    assertAnalyzable(project);
    // Cuota diaria agotada: se responde sin crear un intento que gaste el límite del proyecto.
    if (!this.analyzer.isAvailable()) {
      throw new ServiceUnavailableException({
        message: QUOTA_EXHAUSTED_MESSAGE,
      });
    }

    const { input, catalog, fingerprint, catalogFingerprint } =
      await this.inputBuilder.build(project);
    if (!force) {
      await this.assertSomethingChanged(projectId, {
        fingerprint,
        catalogFingerprint,
      });
    }
    const now = Date.now();
    // Un análisis interrumpido de este proyecto no debe bloquear el nuevo.
    await this.recovery.recover(projectId);
    const claim = await this.analysisRepository.claim(
      {
        projectId,
        requestedById: actor.userId,
        provider: this.analyzer.provider,
        model: this.analyzer.model,
        promptVersion: this.analyzer.promptVersion,
        input: { ...input, fingerprint, catalogFingerprint },
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
    try {
      await this.projectRepository.update(projectId, { status: 'EN_ANALISIS' });
    } catch (error) {
      await this.recordFailure(
        analysisId,
        error,
        startedAt,
        new AnalysisUsageMeter(),
      );
      throw toHttpError(error);
    }

    this.track(this.run(analysisId, input, catalog, startedAt));
    return toAnalysisSummary(claim.analysis);
  }

  /**
   * Repetir un análisis con el mismo proyecto, el mismo catálogo y el mismo prompt gasta una
   * llamada y uno de los cupos del día para obtener, casi siempre, lo mismo: 409 salvo `force`.
   */
  private async assertSomethingChanged(
    projectId: string,
    current: { fingerprint: string; catalogFingerprint: string },
  ): Promise<void> {
    const latest = await this.analysisRepository.findLatestCompleted(projectId);
    const unchanged =
      latest !== null &&
      latest.promptVersion === this.analyzer.promptVersion &&
      latest.input.fingerprint === current.fingerprint &&
      latest.input.catalogFingerprint === current.catalogFingerprint;
    if (unchanged) {
      throw new ConflictException({ message: UNCHANGED_MESSAGE });
    }
  }

  /** Espera a que terminen los análisis en segundo plano de este proceso (pruebas). */
  async whenIdle(): Promise<void> {
    await Promise.allSettled([...this.running]);
  }

  private track(job: Promise<void>): void {
    this.running.add(job);
    void job.finally(() => this.running.delete(job));
  }

  /**
   * La parte lenta, en segundo plano. Nunca lanza: el resultado (o el error) queda en la base,
   * que es lo que consulta el front.
   */
  private async run(
    analysisId: string,
    input: AnalysisInput,
    catalog: SkillEntity[],
    startedAt: number,
  ): Promise<void> {
    // Un solo presupuesto para la IA, su reintento y los embeddings.
    const deadline = startedAt + this.timeouts.totalMs;
    const meter = new AnalysisUsageMeter();
    try {
      const result = await this.analyzeWithRetry(input, deadline, meter);
      const mapped = mapProfilesToCatalog(result.output.profiles, catalog);
      const withoutSoftSkill = profilesWithoutSoftSkill(mapped);
      if (withoutSoftSkill.length > 0) {
        // Se mide cuántas veces pasa antes de decidir si vale otra llamada.
        this.logger.warn('Perfiles sin competencia blanda', {
          method: 'run',
          analysisId,
          profiles: withoutSoftSkill.length,
        });
      }
      const profiles = await this.withEmbeddings(mapped, catalog, deadline);
      // Guarda el análisis, sus perfiles y el paso del proyecto a ANALIZADO en un solo paso.
      const completed = await this.analysisRepository.complete(analysisId, {
        provider: result.provider,
        model: result.model,
        rawOutput: result.rawOutput,
        summary: result.output.summary,
        ...meter.usage(),
        durationMs: Date.now() - startedAt,
        profiles,
      });
      if (!completed) {
        // La recuperación lo cerró mientras la IA respondía: ya quedó en ERROR, pero lo
        // consumido se guarda igual (son los intentos más largos y caros).
        this.logger.warn(ABANDONED_MESSAGE, { method: 'run', analysisId });
        await this.recordUsageOfClosed(analysisId, meter);
        return;
      }
      this.logger.info('Análisis con IA completado', {
        method: 'run',
        analysisId,
        provider: result.provider ?? this.analyzer.provider,
        model: result.model ?? this.analyzer.model,
        attempts: meter.count,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      await this.recordFailure(analysisId, error, startedAt, meter);
    }
  }

  /**
   * Un reintento si la salida del modelo no cumple el esquema y queda tiempo; si falla otra
   * vez, se rinde. Cada llamada recibe solo lo que le queda al presupuesto, y todas quedan en
   * `meter`, también las que fallan.
   */
  private async analyzeWithRetry(
    input: AnalysisInput,
    deadline: number,
    meter: AnalysisUsageMeter,
  ): Promise<AnalyzedResult> {
    for (let attempt = 1; ; attempt++) {
      try {
        const before = meter.count;
        const response = await this.analyzer.analyze(input, {
          timeoutMs: Math.max(deadline - Date.now(), 1),
          onAttempt: meter.record,
        });
        if (meter.count === before) {
          meter.recordUnreportedResponse(this.analyzer, response);
        }
        return {
          provider: response.provider,
          model: response.model,
          output: parseAnalysisOutput(response.output),
          rawOutput: response.output,
        };
      } catch (error) {
        // Una salida cortada por longitud se volvería a cortar: no se repite.
        const retryable =
          error instanceof InvalidAnalysisOutputError &&
          !(error instanceof TruncatedAnalysisOutputError) &&
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
    catalog: SkillEntity[],
    deadline: number,
  ): Promise<NewRequiredProfile[]> {
    const remaining = deadline - Date.now();
    if (remaining < MIN_EMBEDDING_MS) {
      this.logger.warn('Sin tiempo para los embeddings: se guardan sin ellos', {
        method: 'withEmbeddings',
      });
      return profiles;
    }
    const embeddings = await this.profileEmbedder.embed(
      profiles.map((profile) => toEmbeddableNewProfile(profile, catalog)),
      { timeoutMs: Math.min(remaining, this.timeouts.embeddingMs) },
    );
    return profiles.map((profile, index) => ({
      ...profile,
      embedding: embeddings[index],
    }));
  }

  /** El análisis ya lo cerró la recuperación: se guarda lo consumido sin tocar su estado. */
  private async recordUsageOfClosed(
    analysisId: string,
    meter: AnalysisUsageMeter,
  ): Promise<void> {
    if (meter.count === 0) return;
    try {
      await this.analysisRepository.recordUsage(analysisId, meter.usage());
    } catch (error) {
      this.logger.error('No se pudo guardar el consumo del análisis', error, {
        method: 'recordUsageOfClosed',
        analysisId,
      });
    }
  }

  private async recordFailure(
    analysisId: string,
    error: unknown,
    startedAt: number,
    meter: AnalysisUsageMeter,
  ): Promise<void> {
    // El detalle técnico va al log; en la base y en las respuestas solo un mensaje seguro.
    this.logger.error('El análisis con IA falló', error, {
      method: 'execute',
      analysisId,
    });
    try {
      // El repositorio también devuelve el proyecto a su estado; si el análisis ya no estaba
      // PENDIENTE, la recuperación lo cerró antes y no se escribe nada.
      const failed = await this.analysisRepository.fail(analysisId, {
        errorMessage: failureMessage(error),
        durationMs: Date.now() - startedAt,
        ...meter.usage(),
      });
      if (!failed) await this.recordUsageOfClosed(analysisId, meter);
    } catch (cleanupError) {
      this.logger.error(
        'No se pudo registrar el fallo del análisis',
        cleanupError,
        { method: 'recordFailure', analysisId },
      );
    }
  }
}

/** RF6: el proyecto debe tener lo mínimo para que la IA tenga de qué partir. */
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
