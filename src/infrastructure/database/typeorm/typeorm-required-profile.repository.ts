import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RequiredProfileEntity } from '../../../domain/entities/required-profile.entity';
import type { StoredEmbedding } from '../../../domain/entities/stored-embedding';
import type {
  CreateManualRequiredProfileDto,
  RequiredProfileRepository,
  UpdateRequiredProfileRepositoryDto,
} from '../../../domain/repositories/required-profile.repository.interface';
import { pickDefined } from '../../../shared/utils/pick-defined';
import { embeddingColumns, parseVector } from './mappers/embedding-columns';
import { toRequiredProfileEntity } from './mappers/project-analysis.mapper';
import { RequiredProfileSkillOrmEntity } from './required-profile-skill.orm-entity';
import { RequiredProfileOrmEntity } from './required-profile.orm-entity';

const SKILL_RELATIONS = { skills: { skill: true } } as const;

/** Perfil activo cuyo embedding falta o es de otro modelo (no comparable con las personas). */
const STALE_EMBEDDING =
  'profile.active = true AND profile.embeddingModel IS DISTINCT FROM :model';

@Injectable()
export class TypeOrmRequiredProfileRepository implements RequiredProfileRepository {
  constructor(
    @InjectRepository(RequiredProfileOrmEntity)
    private readonly repository: Repository<RequiredProfileOrmEntity>,
  ) {}

  async findById(id: string): Promise<RequiredProfileEntity | null> {
    const profile = await this.repository.findOne({
      where: { id },
      relations: SKILL_RELATIONS,
    });
    return profile ? toRequiredProfileEntity(profile) : null;
  }

  async findEmbeddings(
    ids: string[],
    model: string,
  ): Promise<Map<string, number[]>> {
    if (ids.length === 0) return new Map();
    const profiles = await this.repository
      .createQueryBuilder('profile')
      .select('profile.id')
      .addSelect('profile.embedding')
      .where('profile.id IN (:...ids)', { ids })
      .andWhere('profile.embeddingModel = :model', { model })
      .getMany();
    return new Map(
      profiles.flatMap((profile) =>
        profile.embedding ? [[profile.id, parseVector(profile.embedding)]] : [],
      ),
    );
  }

  async findWithStaleEmbedding(
    model: string,
    limit: number,
  ): Promise<RequiredProfileEntity[]> {
    const profiles = await this.repository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.skills', 'skill')
      .leftJoinAndSelect('skill.skill', 'catalogSkill')
      .where(STALE_EMBEDDING, { model })
      .orderBy('profile.createdAt', 'ASC')
      .addOrderBy('profile.id', 'ASC')
      .take(limit)
      .getMany();
    return profiles.map(toRequiredProfileEntity);
  }

  countWithStaleEmbedding(model: string): Promise<number> {
    return this.repository
      .createQueryBuilder('profile')
      .where(STALE_EMBEDDING, { model })
      .getCount();
  }

  async saveEmbedding(
    id: string,
    embedding: StoredEmbedding | null,
  ): Promise<void> {
    await this.repository.update({ id }, embeddingColumns(embedding));
  }

  async markAllEmbeddingsStale(): Promise<void> {
    // Sin WHERE a propósito (todas las filas): `update({}, …)` lo rechaza TypeORM.
    await this.repository
      .createQueryBuilder()
      .update(RequiredProfileOrmEntity)
      .set({ embeddingModel: null })
      .execute();
  }

  async findActiveForProject(
    projectId: string,
    analysisId: string | null,
  ): Promise<RequiredProfileEntity[]> {
    const query = this.repository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.skills', 'skill')
      .leftJoinAndSelect('skill.skill', 'catalogSkill')
      .where('profile.projectId = :projectId', { projectId })
      .andWhere('profile.active = true');

    if (analysisId) {
      query.andWhere(
        "(profile.analysisId = :analysisId OR profile.source = 'MANUAL')",
        { analysisId },
      );
    } else {
      query.andWhere("profile.source = 'MANUAL'");
    }

    const profiles = await query.orderBy('profile.position', 'ASC').getMany();
    return profiles.map(toRequiredProfileEntity);
  }
  async createManual(
    data: CreateManualRequiredProfileDto,
  ): Promise<RequiredProfileEntity> {
    const { max } = (await this.repository
      .createQueryBuilder('profile')
      .select('COALESCE(MAX(profile.position), -1)', 'max')
      .where('profile.projectId = :projectId', { projectId: data.projectId })
      .getRawOne<{ max: number }>()) ?? { max: -1 };

    const saved = await this.repository.save(
      this.repository.create({
        projectId: data.projectId,
        analysisId: null,
        source: 'MANUAL',
        name: data.name,
        description: data.description,
        justification: data.justification,
        quantity: data.quantity,
        priority: data.priority,
        minWeeklyHours: data.minWeeklyHours,
        position: Number(max) + 1,
        ...embeddingColumns(data.embedding),
        active: true,
        skills: data.skills.map((skill) => ({ ...skill })),
      }),
    );
    return (await this.findById(saved.id)) as RequiredProfileEntity;
  }

  async update(
    id: string,
    data: UpdateRequiredProfileRepositoryDto,
  ): Promise<RequiredProfileEntity | null> {
    const { skills, embedding, ...columns } = data;
    const found = await this.repository.manager.transaction(async (manager) => {
      const profile = await manager.findOne(RequiredProfileOrmEntity, {
        where: { id },
      });
      if (!profile) return false;

      manager.merge(RequiredProfileOrmEntity, profile, {
        ...pickDefined(columns),
        // `null` a propósito vacía el embedding (y su modelo); `undefined` lo deja como estaba.
        ...(embedding === undefined ? {} : embeddingColumns(embedding)),
      });
      await manager.save(profile);

      // Las habilidades se reemplazan completas: es un perfil pequeño (2–8 filas).
      if (skills !== undefined) {
        await manager.delete(RequiredProfileSkillOrmEntity, {
          requiredProfileId: id,
        });
        await manager.save(
          skills.map((skill) =>
            manager.create(RequiredProfileSkillOrmEntity, {
              ...skill,
              requiredProfileId: id,
            }),
          ),
        );
      }
      return true;
    });
    return found ? this.findById(id) : null;
  }
}
