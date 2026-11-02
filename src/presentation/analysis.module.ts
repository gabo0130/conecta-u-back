import { Module } from '@nestjs/common';
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
import { FakeEmbeddingProvider } from '../infrastructure/ai/fake-embedding-provider';
import { FakeProjectAnalyzer } from '../infrastructure/ai/fake-project-analyzer';
import { GeminiEmbeddingProvider } from '../infrastructure/ai/gemini-embedding-provider';
import { GeminiProjectAnalyzer } from '../infrastructure/ai/gemini-project-analyzer';
import { QuotaCircuitBreaker } from '../infrastructure/ai/quota-circuit-breaker';
import {
  ANALYSIS_TIMEOUTS,
  EMBEDDING_PROVIDER,
  GEMINI_QUOTA_BREAKER,
  PROJECT_ANALYZER,
} from '../shared/interfaces/tokens';
import { AnalysisController } from './controllers/analysis.controller';
import { RequiredProfilesController } from './controllers/required-profiles.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';
import {
  geminiGeneratorOptions,
  useGemini,
} from './support/ai-provider-config';

const DEFAULT_EMBEDDING_DIM = 768;
const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';

const numberOf = (config: ConfigService, key: string, fallback: number) =>
  Number(config.get<string>(key)) || fallback;

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
 * Análisis de proyectos con IA (RF8–RF10). `AI_PROVIDER=gemini` usa la API real (exige
 * `GEMINI_API_KEY`); cualquier otro valor, o ninguno, usa los adaptadores deterministas
 * sin red, útiles en desarrollo y como respaldo en una demostración.
 */
@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [AnalysisController, RequiredProfilesController],
  providers: [
    { provide: GEMINI_QUOTA_BREAKER, useValue: new QuotaCircuitBreaker() },
    {
      provide: PROJECT_ANALYZER,
      inject: [ConfigService, GEMINI_QUOTA_BREAKER],
      useFactory: (config: ConfigService, breaker: QuotaCircuitBreaker) =>
        useGemini(config)
          ? new GeminiProjectAnalyzer(geminiGeneratorOptions(config, breaker))
          : new FakeProjectAnalyzer(),
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
    GEMINI_QUOTA_BREAKER,
    EMBEDDING_PROVIDER,
    ANALYSIS_TIMEOUTS,
    ProfileEmbedder,
  ],
})
export class AnalysisModule {}
