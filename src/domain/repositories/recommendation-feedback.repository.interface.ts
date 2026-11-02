import type { RecommendationFeedbackEntity } from '../entities/recommendation-feedback';

export type FeedbackInput = Omit<
  RecommendationFeedbackEntity,
  'id' | 'decidedAt'
>;

export interface FeedbackCounts {
  accepted: number;
  discarded: number;
}

export interface ProjectFeedbackCounts extends FeedbackCounts {
  projectId: string;
  projectTitle: string;
}

export interface RecommendationFeedbackRepository {
  /** Crea o reemplaza la decisión para (perfil, persona): vale la última. */
  upsert(input: FeedbackInput): Promise<RecommendationFeedbackEntity>;
  findByProject(projectId: string): Promise<RecommendationFeedbackEntity[]>;
  countGlobal(): Promise<FeedbackCounts>;
  /** Por proyecto, de más a menos decisiones. */
  countByProject(): Promise<ProjectFeedbackCounts[]>;
}
