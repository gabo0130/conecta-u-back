import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SkillEntity } from '../../../domain/entities/skill.entity';
import {
  CreateSkillRepositoryDto,
  SkillRepository,
  SkillSearchFilter,
} from '../../../domain/repositories/skill.repository.interface';
import { toSkillEntity } from './mappers/skill.mapper';
import { SkillOrmEntity } from './skill.orm-entity';

@Injectable()
export class TypeOrmSkillRepository implements SkillRepository {
  constructor(
    @InjectRepository(SkillOrmEntity)
    private readonly repository: Repository<SkillOrmEntity>,
  ) {}

  async findById(id: string): Promise<SkillEntity | null> {
    const skill = await this.repository.findOne({ where: { id } });
    return skill ? toSkillEntity(skill) : null;
  }

  async findByIds(ids: string[]): Promise<SkillEntity[]> {
    if (ids.length === 0) {
      return [];
    }
    const skills = await this.repository.find({ where: { id: In(ids) } });
    return skills.map(toSkillEntity);
  }

  async findByNormalizedNameOrSynonym(
    normalized: string,
  ): Promise<SkillEntity | null> {
    const byName = await this.repository.findOne({
      where: { normalizedName: normalized },
    });
    if (byName) {
      return toSkillEntity(byName);
    }

    const bySynonym = await this.repository
      .createQueryBuilder('skill')
      .where(':normalized = ANY(skill.synonyms)', { normalized })
      .getOne();

    return bySynonym ? toSkillEntity(bySynonym) : null;
  }

  async search(filter: SkillSearchFilter): Promise<SkillEntity[]> {
    const query = this.repository.createQueryBuilder('skill');

    if (filter.normalizedQuery) {
      // El texto normalizado no contiene `%` ni `_`, así que no hay comodines que escapar.
      const like = `%${filter.normalizedQuery}%`;
      query.andWhere(
        '(skill.normalizedName LIKE :like OR EXISTS (SELECT 1 FROM unnest(skill.synonyms) s WHERE s LIKE :like))',
        { like },
      );
    }

    if (filter.type) {
      query.andWhere('skill.type = :type', { type: filter.type });
    }

    query.orderBy('skill.name', 'ASC');

    const skills = await query.getMany();
    return skills.map(toSkillEntity);
  }

  async create(data: CreateSkillRepositoryDto): Promise<SkillEntity> {
    const skill = this.repository.create({
      name: data.name,
      normalizedName: data.normalizedName,
      type: data.type,
      category: data.category ?? 'OTRA',
      synonyms: data.synonyms ?? [],
      status: data.status ?? 'ACTIVA',
    });

    const saved = await this.repository.save(skill);
    return toSkillEntity(saved);
  }
}
