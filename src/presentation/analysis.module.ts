import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMBEDDING_COLUMN_DIMENSIONS } from '../infrastructure/database/typeorm/required-profile.orm-entity';
import { AnalysisInputBuilder } from '../application/analysis/analysis-input.builder';
import { AnalysisRecoveryService } from '../application/analysis/analysis-recovery.service';
import {
  type AnalysisTimeouts,
  parseAnalysisTimeouts,
} from '../application/analysis/analysis-timeouts';
import { ProfileEmbedder } from '../application/analysis/profile-embedder';
import { CreateRequiredProfileUseCase } from '../application/use-cases/create-required-profile.use-case';
import { UpdateRequiredProfileUseCase } from '../application/use-cases/update-required-profile.use-case';
import { GetProjectAnalysisUseCase } from '../application/use-cases/get-project-analysis.use-case';
import { ListProjectAnalysesUseCase } from '../application/use-cases/list-project-analyses.use-case';
import { RequestProjectAnalysisUseCase } from '../application/use-cases/request-project-analysis.use-case';
import {
  ClaudeProjectAnalyzer,
  DEFAULT_CLAUDE_MODEL,
} from '../infrastructure/ai/claude-project-analyzer';
import { FakeEmbeddingProvider } from '../infrastructure/ai/fake-embedding-provider';
import { FakeProjectAnalyzer } from '../infrastructure/ai/fake-project-analyzer';
import {
  DEFAULT_PRIMARY_ANALYZER_TIMEOUT_MS,
  FallbackProjectAnalyzer,
} from '../infrastructure/ai/fallback-project-analyzer';
import { GeminiEmbeddingProvider } from '../infrastructure/ai/gemini-embedding-provider';
import {
  GeminiProjectAnalyzer,
  DEFAULT_PRIMARY_TIMEOUT_MS,
} from '../infrastructure/ai/gemini-project-analyzer';
import type { ProjectAnalyzer } from '../domain/repositories/project-analyzer.interface';
import {
  ANALYSIS_TIMEOUTS,
  EMBEDDING_PROVIDER,
  PROJECT_ANALYZER,
} from '../shared/interfaces/tokens';
import { AnalysisController } from './controllers/analysis.controller';
import { RequiredProfilesController } from './controllers/required-profiles.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

const DEFAULT_EMBEDDING_DIM = 768;
const DEFAULT_MODEL = 'gemini-3.8-flash';
const DEFAULT_FALLBACK_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';

const logger = new Logger('AnalysisModule');

type AiProvider = 'claude' | 'gemini' | 'fake';
const AI_PROVIDERS: readonly AiProvider[] = ['claude', 'gemini', 'fake'];

function aiProviderOf(config: ConfigService): AiProvider {
  const provider = config.get<string>('AI_PROVIDER') ?? 'fake';
  if (AI_PROVIDERS.includes(provider as AiProvider)) {
    return provider as AiProvider;
  }
  logger.warn(
    `AI_PROVIDER="${provider}" no es válido (claude|gemini|fake): se usa el proveedor fake.`,
  );
  return 'fake';
}

/**
 * Gemini da los embeddings con `gemini` y también con `claude` (Anthropic no ofrece embeddings):
 * los dos exigen `GEMINI_API_KEY`.
 */
const useGemini = (config: ConfigService): boolean =>
  aiProviderOf(config) !== 'fake';

function geminiAnalyzer(config: ConfigService): GeminiProjectAnalyzer {
  return new GeminiProjectAnalyzer({
    apiKey: config.getOrThrow<string>('GEMINI_API_KEY'),
    model: config.get<string>('GEMINI_MODEL') ?? DEFAULT_MODEL,
    fallbackModel: fallbackModelOf(config),
    primaryTimeoutMs: numberOf(
      config,
      'GEMINI_PRIMARY_TIMEOUT_MS',
      DEFAULT_PRIMARY_TIMEOUT_MS,
    ),
  });
}

/**
 * `claude`: Claude (Haiku por defecto) con Gemini de respaldo.
 * `gemini`: solo Gemini (con su modelo de respaldo). `fake`: sin red.
 */
function analyzerOf(config: ConfigService): ProjectAnalyzer {
  const provider = aiProviderOf(config);
  if (provider === 'gemini') return geminiAnalyzer(config);
  if (provider === 'fake') return new FakeProjectAnalyzer();

  const claude = new ClaudeProjectAnalyzer({
    apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    model: config.get<string>('CLAUDE_MODEL') || DEFAULT_CLAUDE_MODEL,
  });
  return new FallbackProjectAnalyzer(
    claude,
    geminiAnalyzer(config),
    numberOf(config, 'CLAUDE_TIMEOUT_MS', DEFAULT_PRIMARY_ANALYZER_TIMEOUT_MS),
  );
}

const numberOf = (config: ConfigService, key: string, fallback: number) =>
  Number(config.get<string>(key)) || fallback;

/** `GEMINI_FALLBACK_MODEL` vacío desactiva el respaldo. */
const fallbackModelOf = (config: ConfigService): string | undefined =>
  (config.get<string>('GEMINI_FALLBACK_MODEL') ?? DEFAULT_FALLBACK_MODEL) ||
  undefined;

const timeoutsOf = (config: ConfigService): AnalysisTimeouts =>
  parseAnalysisTimeouts(
    config.get<string>('AI_TIMEOUT_MS'),
    config.get<string>('EMBEDDING_TIMEOUT_MS'),
  );

/** La columna `vector(768)` de la migración fija la dimensión: otro valor tumbaría el guardado. */
function embeddingDimensions(config: ConfigService): number {
  const dimensions = numberOf(config, 'EMBEDDING_DIM', DEFAULT_EMBEDDING_DIM);
  if (dimensions !== EMBEDDING_COLUMN_DIMENSIONS) {
    throw new Error(
      `EMBEDDING_DIM=${dimensions} no coincide con la columna vector(${EMBEDDING_COLUMN_DIMENSIONS}). Cambiar la dimensión exige una migración.`,
    );
  }
  return dimensions;
}

/**
 * Análisis de proyectos con IA (RF8–RF10). `AI_PROVIDER=claude` usa Claude con Gemini de
 * respaldo (exige `ANTHROPIC_API_KEY` y `GEMINI_API_KEY`, que también da los embeddings);
 * `gemini`, solo Gemini; cualquier otro valor, o ninguno, los adaptadores deterministas sin red,
 * útiles en desarrollo y como respaldo en una demostración.
 */
@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [AnalysisController, RequiredProfilesController],
  providers: [
    {
      provide: PROJECT_ANALYZER,
      inject: [ConfigService],
      useFactory: analyzerOf,
    },
    {
      provide: EMBEDDING_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dimensions = embeddingDimensions(config);
        return useGemini(config)
          ? new GeminiEmbeddingProvider({
              apiKey: config.getOrThrow<string>('GEMINI_API_KEY'),
              model:
                config.get<string>('GEMINI_EMBEDDING_MODEL') ??
                DEFAULT_EMBEDDING_MODEL,
              dimensions,
              timeoutMs: timeoutsOf(config).embeddingMs,
            })
          : new FakeEmbeddingProvider(dimensions);
      },
    },
    {
      provide: ANALYSIS_TIMEOUTS,
      inject: [ConfigService],
      useFactory: timeoutsOf,
    },
    AnalysisInputBuilder,
    AnalysisRecoveryService,
    ProfileEmbedder,
    CreateRequiredProfileUseCase,
    UpdateRequiredProfileUseCase,
    RequestProjectAnalysisUseCase,
    GetProjectAnalysisUseCase,
    ListProjectAnalysesUseCase,
  ],
  exports: [
    PROJECT_ANALYZER,
    EMBEDDING_PROVIDER,
    ANALYSIS_TIMEOUTS,
    ProfileEmbedder,
  ],
})
export class AnalysisModule {}
