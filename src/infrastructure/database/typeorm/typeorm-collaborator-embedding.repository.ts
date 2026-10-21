import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository, type FindOptionsWhere } from 'typeorm';
import type { CollaboratorEntity } from '../../../domain/entities/collaborator.entity';
import type { CollaboratorEmbeddingRepository } from '../../../domain/repositories/collaborator-embedding.repository.interface';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { toCollaboratorEntity } from './mappers/collaborator.mapper';

const RELATIONS = [
  'skills',
  'skills.skill',
  'experiences',
  'experiences.technologies',
];

/**
 * Candidatas (activas y con consentimiento) sin embedding vigente para `model`: nunca
 * calculado, invalidado por un cambio del perfil, o generado con otro modelo.
 */
function staleCandidates(
  model: string,
): FindOptionsWhere<CollaboratorOrmEntity>[] {
  const candidate = { active: true, dataConsent: true };
  return [
    { ...candidate, embeddingUpdatedAt: IsNull() },
    { ...candidate, embeddingModel: IsNull() },
    { ...candidate, embeddingModel: Not(model) },
  ];
}

@Injectable()
export class TypeOrmCollaboratorEmbeddingRepository implements CollaboratorEmbeddingRepository {
  constructor(
    @InjectRepository(CollaboratorOrmEntity)
    private readonly repository: Repository<CollaboratorOrmEntity>,
  ) {}

  async findStale(model: string, limit: number): Promise<CollaboratorEntity[]> {
    const collaborators = await this.repository.find({
      where: staleCandidates(model),
      relations: RELATIONS,
      order: { createdAt: 'ASC', id: 'ASC' },
      take: limit,
    });
    return collaborators.map(toCollaboratorEntity);
  }

  countStale(model: string): Promise<number> {
    return this.repository.count({ where: staleCandidates(model) });
  }

  async markAllStale(): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(CollaboratorOrmEntity)
      .set({ embeddingUpdatedAt: null })
      .execute();
  }

  async save(
    collaboratorId: string,
    embedding: number[] | null,
    model: string,
  ): Promise<void> {
    await this.repository.update(
      { id: collaboratorId },
      {
        profileEmbedding: embedding,
        embeddingModel: model,
        embeddingUpdatedAt: new Date(),
      },
    );
  }
}
