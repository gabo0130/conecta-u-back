import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AvailabilityStatus } from '../../../domain/entities/availability-status.type';
import type { PersonType } from '../../../domain/entities/person-type.type';
import type {
  MatchCandidate,
  NewRecommendation,
  RecommendationFilter,
  RecommendationRepository,
  RecommendationView,
} from '../../../domain/repositories/recommendation.repository.interface';
import type { MatchBreakdown } from '../../../domain/services/match-score';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { toCollaboratorEntity } from './mappers/collaborator.mapper';
import { RecommendationOrmEntity } from './recommendation.orm-entity';
import { parseVector } from './mappers/embedding-columns';

@Injectable()
export class TypeOrmRecommendationRepository implements RecommendationRepository {
  constructor(
    @InjectRepository(RecommendationOrmEntity)
    private readonly repository: Repository<RecommendationOrmEntity>,
    @InjectRepository(CollaboratorOrmEntity)
    private readonly collaborators: Repository<CollaboratorOrmEntity>,
  ) {}

  async findCandidates(embeddingModel: string): Promise<MatchCandidate[]> {
    const rows = await this.collaborators
      .createQueryBuilder('collaborator')
      .leftJoinAndSelect('collaborator.skills', 'skills')
      .leftJoinAndSelect('skills.skill', 'skill')
      .leftJoinAndSelect('collaborator.experiences', 'experiences')
      .leftJoinAndSelect('experiences.technologies', 'technologies')
      .addSelect('collaborator.profileEmbedding')
      .where('collaborator.active = true')
      .andWhere('collaborator.dataConsent = true')
      .getMany();

    return rows.map((row) => ({
      collaborator: toCollaboratorEntity(row),
      embedding:
        row.profileEmbedding && row.embeddingModel === embeddingModel
          ? parseVector(row.profileEmbedding)
          : null,
    }));
  }

  async replaceForProject(
    projectId: string,
    rows: NewRecommendation[],
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(RecommendationOrmEntity)
        .where(
          '"requiredProfileId" IN (SELECT id FROM required_profiles WHERE "projectId" = :projectId)',
          { projectId },
        )
        .execute();
      if (rows.length > 0) {
        await manager.save(
          rows.map((row) =>
            manager.create(RecommendationOrmEntity, {
              ...row,
              breakdown: row.breakdown as unknown as Record<string, unknown>,
            }),
          ),
        );
      }
    });
  }

  async findByProject(
    projectId: string,
    filter: RecommendationFilter,
  ): Promise<RecommendationView[]> {
    const query = this.baseQuery()
      .where('profile.projectId = :projectId', { projectId })
      .andWhere('profile.active = true');
    if (filter.profileId) {
      query.andWhere('profile.id = :profileId', {
        profileId: filter.profileId,
      });
    }
    if (!filter.includeUnavailable) {
      query.andWhere("collaborator.availabilityStatus <> 'NO_DISPONIBLE'");
    }
    const rows = await query
      .orderBy('profile.position', 'ASC')
      .addOrderBy('recommendation.rank', 'ASC')
      .getMany();
    return rows.map(toView);
  }

  async findViewById(id: string): Promise<RecommendationView | null> {
    const row = await this.baseQuery()
      .where('recommendation.id = :id', { id })
      .getOne();
    return row ? toView(row) : null;
  }

  private baseQuery() {
    return (
      this.repository
        .createQueryBuilder('recommendation')
        .innerJoin('recommendation.requiredProfile', 'profile')
        // Quien retiró el consentimiento o fue desactivado deja de verse sin esperar a regenerar (Ley 1581).
        .innerJoinAndSelect(
          'recommendation.collaborator',
          'collaborator',
          'collaborator.active = true AND collaborator.dataConsent = true',
        )
        .innerJoinAndSelect('collaborator.program', 'program')
    );
  }
}

function toView(row: RecommendationOrmEntity): RecommendationView {
  const collaborator = row.collaborator!;
  return {
    id: row.id,
    requiredProfileId: row.requiredProfileId,
    rank: row.rank,
    score: row.score,
    skillScore: row.skillScore,
    semanticScore: row.semanticScore,
    experienceScore: row.experienceScore,
    availabilityScore: row.availabilityScore,
    breakdown: row.breakdown as unknown as MatchBreakdown,
    generatedAt: row.generatedAt,
    collaborator: {
      id: collaborator.id,
      fullName: `${collaborator.firstName} ${collaborator.lastName}`.trim(),
      personType: collaborator.personType as PersonType,
      programName: collaborator.program.name,
      researchGroup: collaborator.researchGroup,
      availabilityStatus: collaborator.availabilityStatus as AvailabilityStatus,
      weeklyHours: collaborator.weeklyHours,
      hasUser: collaborator.userId !== null,
    },
  };
}
