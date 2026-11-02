import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  FeedbackDecision,
  RecommendationFeedbackEntity,
} from '../../../domain/entities/recommendation-feedback';
import type {
  FeedbackCounts,
  FeedbackInput,
  ProjectFeedbackCounts,
  RecommendationFeedbackRepository,
} from '../../../domain/repositories/recommendation-feedback.repository.interface';
import { ProjectOrmEntity } from './project.orm-entity';
import { RecommendationFeedbackOrmEntity } from './recommendation-feedback.orm-entity';

function toEntity(
  row: RecommendationFeedbackOrmEntity,
): RecommendationFeedbackEntity {
  return {
    id: row.id,
    projectId: row.projectId,
    requiredProfileId: row.requiredProfileId,
    collaboratorId: row.collaboratorId,
    decision: row.decision as FeedbackDecision,
    reason: row.reason,
    rankAtDecision: row.rankAtDecision,
    scoreAtDecision: row.scoreAtDecision,
    decidedById: row.decidedById,
    decidedAt: row.decidedAt,
  };
}

const COUNT_COLUMNS = `COUNT(*) FILTER (WHERE feedback.decision = 'ACEPTADA') AS accepted,
  COUNT(*) FILTER (WHERE feedback.decision = 'DESCARTADA') AS discarded`;

@Injectable()
export class TypeOrmRecommendationFeedbackRepository implements RecommendationFeedbackRepository {
  constructor(
    @InjectRepository(RecommendationFeedbackOrmEntity)
    private readonly repository: Repository<RecommendationFeedbackOrmEntity>,
  ) {}

  async upsert(input: FeedbackInput): Promise<RecommendationFeedbackEntity> {
    await this.repository.upsert(input, {
      conflictPaths: ['requiredProfileId', 'collaboratorId'],
    });
    const row = await this.repository.findOneOrFail({
      where: {
        requiredProfileId: input.requiredProfileId,
        collaboratorId: input.collaboratorId,
      },
    });
    return toEntity(row);
  }

  async findByProject(
    projectId: string,
  ): Promise<RecommendationFeedbackEntity[]> {
    const rows = await this.repository.find({ where: { projectId } });
    return rows.map(toEntity);
  }

  async countGlobal(): Promise<FeedbackCounts> {
    const row = await this.repository
      .createQueryBuilder('feedback')
      .select(COUNT_COLUMNS)
      .getRawOne<{ accepted: string; discarded: string }>();
    return {
      accepted: Number(row?.accepted ?? 0),
      discarded: Number(row?.discarded ?? 0),
    };
  }

  async countByProject(): Promise<ProjectFeedbackCounts[]> {
    const rows = await this.repository
      .createQueryBuilder('feedback')
      .innerJoin(ProjectOrmEntity, 'project', 'project.id = feedback.projectId')
      .select('feedback.projectId', 'projectId')
      .addSelect('project.title', 'projectTitle')
      .addSelect(COUNT_COLUMNS)
      .groupBy('feedback.projectId')
      .addGroupBy('project.title')
      .orderBy('COUNT(*)', 'DESC')
      .addOrderBy('project.title', 'ASC')
      .getRawMany<{
        projectId: string;
        projectTitle: string;
        accepted: string;
        discarded: string;
      }>();
    return rows.map((row) => ({
      projectId: row.projectId,
      projectTitle: row.projectTitle,
      accepted: Number(row.accepted),
      discarded: Number(row.discarded),
    }));
  }
}
