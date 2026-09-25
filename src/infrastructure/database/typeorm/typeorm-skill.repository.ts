import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillEntity } from '../../../domain/entities/skill.entity';
import {
  CreateSkillRepositoryDto,
  SkillRepository,
  SkillSearchFilter,
} from '../../../domain/repositories/skill.repository.interface';
import { SkillOrmEntity } from './skill.orm-entity';

@Injectable()
export class TypeOrmSkillRepository implements SkillRepository {
  constructor(
    @InjectRepository(SkillOrmEntity)
    private readonly repository: Repository<SkillOrmEntity>,
  ) {}

  async findById(id: string): Promise<SkillEntity | null> {
    const skill = await this.repository.findOne({ where: { id } });
    return skill ? this.toDomain(skill) : null;
  }

  async findByNormalizedNameOrSynonym(
    normalized: string,
  ): Promise<SkillEntity | null> {
    const byName = await this.repository.findOne({
      where: { normalizedName: normalized },
    });
    if (byName) {
      return this.toDomain(byName);
    }

    const bySynonym = await this.repository
      .createQueryBuilder('skill')
      .where(':normalized = ANY(skill.synonyms)', { normalized })
      .getOne();

    return bySynonym ? this.toDomain(bySynonym) : null;
  }

  async search(filter: SkillSearchFilter): Promise<SkillEntity[]> {
    const query = this.repository.createQueryBuilder('skill');

    if (filter.query) {
      const like = `%${filter.query.toLowerCase()}%`;
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
    return skills.map((skill) => this.toDomain(skill));
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
    return this.toDomain(saved);
  }

  private toDomain(skill: SkillOrmEntity): SkillEntity {
    return new SkillEntity(
      skill.id,
      skill.name,
      skill.normalizedName,
      skill.type as SkillEntity['type'],
      skill.category as SkillEntity['category'],
      skill.synonyms,
      skill.status as SkillEntity['status'],
    );
  }
}
