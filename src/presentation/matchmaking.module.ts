import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CollaboratorEmbeddingService } from '../application/analysis/collaborator-embedding.service';
import { parseMatchSettings } from '../application/matchmaking/match-settings';
import { GenerateRecommendationsUseCase } from '../application/use-cases/generate-recommendations.use-case';
import { GetRecommendationDetailUseCase } from '../application/use-cases/get-recommendation-detail.use-case';
import { ListRecommendationsUseCase } from '../application/use-cases/list-recommendations.use-case';
import { RebuildEmbeddingsUseCase } from '../application/use-cases/rebuild-embeddings.use-case';
import { MATCH_SETTINGS } from '../shared/interfaces/tokens';
import { AnalysisModule } from './analysis.module';
import { AdminEmbeddingsController } from './controllers/admin-embeddings.controller';
import { RecommendationsController } from './controllers/recommendations.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

/** Matchmaking híbrido (RF15–RF17): embeddings de personas y recomendaciones por perfil. */
@Module({
  imports: [PersistenceModule, SecurityModule, AnalysisModule],
  controllers: [AdminEmbeddingsController, RecommendationsController],
  providers: [
    {
      provide: MATCH_SETTINGS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        parseMatchSettings(
          config.get<string>('MATCH_WEIGHTS'),
          config.get<string>('MATCH_TOP_N'),
        ),
    },
    CollaboratorEmbeddingService,
    RebuildEmbeddingsUseCase,
    GenerateRecommendationsUseCase,
    ListRecommendationsUseCase,
    GetRecommendationDetailUseCase,
  ],
  exports: [CollaboratorEmbeddingService],
})
export class MatchmakingModule {}
