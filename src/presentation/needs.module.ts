import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CharacterizeNeedUseCase } from '../application/use-cases/characterize-need.use-case';
import { FakeNeedCharacterizer } from '../infrastructure/ai/fake-need-characterizer';
import { GeminiNeedCharacterizer } from '../infrastructure/ai/gemini-need-characterizer';
import type { QuotaCircuitBreaker } from '../infrastructure/ai/quota-circuit-breaker';
import {
  GEMINI_QUOTA_BREAKER,
  NEED_CHARACTERIZER,
} from '../shared/interfaces/tokens';
import { AnalysisModule } from './analysis.module';
import { ConvertNeedToOpportunityUseCase } from '../application/use-cases/convert-need-to-opportunity.use-case';
import { CreateNeedUseCase } from '../application/use-cases/create-need.use-case';
import { CreateProjectUseCase } from '../application/use-cases/create-project.use-case';
import { GetOpportunityDraftUseCase } from '../application/use-cases/get-opportunity-draft.use-case';
import { DiscardNeedUseCase } from '../application/use-cases/discard-need.use-case';
import { GetNeedUseCase } from '../application/use-cases/get-need.use-case';
import { ListNeedsUseCase } from '../application/use-cases/list-needs.use-case';
import { UpdateNeedUseCase } from '../application/use-cases/update-need.use-case';
import { NeedsController } from './controllers/needs.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';
import {
  geminiGeneratorOptions,
  useGemini,
} from './support/ai-provider-config';

/** Tesis (PGCS01): necesidades institucionales → caracterización → oportunidad. */
@Module({
  imports: [PersistenceModule, SecurityModule, AnalysisModule],
  controllers: [NeedsController],
  providers: [
    {
      provide: NEED_CHARACTERIZER,
      inject: [ConfigService, GEMINI_QUOTA_BREAKER],
      useFactory: (config: ConfigService, breaker: QuotaCircuitBreaker) =>
        useGemini(config)
          ? new GeminiNeedCharacterizer(geminiGeneratorOptions(config, breaker))
          : new FakeNeedCharacterizer(),
    },
    CreateNeedUseCase,
    CharacterizeNeedUseCase,
    CreateProjectUseCase,
    ConvertNeedToOpportunityUseCase,
    GetOpportunityDraftUseCase,
    ListNeedsUseCase,
    GetNeedUseCase,
    UpdateNeedUseCase,
    DiscardNeedUseCase,
  ],
})
export class NeedsModule {}
