import { Inject, Injectable } from '@nestjs/common';
import { acceptanceRate } from '../../domain/entities/recommendation-feedback';
import type { RecommendationFeedbackRepository } from '../../domain/repositories/recommendation-feedback.repository.interface';
import { RECOMMENDATION_FEEDBACK_REPOSITORY } from '../../shared/interfaces/tokens';

const withRate = <T extends { accepted: number; discarded: number }>(
  counts: T,
) => ({
  ...counts,
  decided: counts.accepted + counts.discarded,
  acceptanceRate: acceptanceRate(counts.accepted, counts.discarded),
});

/**
 * Tesis (T7, D6): tasa de aceptación de las recomendaciones, global y por proyecto (solo
 * ADMIN). Mide decisiones reales de los líderes: no se mezcla con la evaluación sintética.
 */
@Injectable()
export class GetEvaluationSummaryUseCase {
  constructor(
    @Inject(RECOMMENDATION_FEEDBACK_REPOSITORY)
    private readonly feedbackRepository: RecommendationFeedbackRepository,
  ) {}

  async execute() {
    const [global, byProject] = await Promise.all([
      this.feedbackRepository.countGlobal(),
      this.feedbackRepository.countByProject(),
    ]);
    return {
      acceptance: withRate(global),
      byProject: byProject.map(withRate),
    };
  }
}
