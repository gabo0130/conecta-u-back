import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SkillEntity } from '../../../domain/entities/skill.entity';
import {
  CreateSkillRepositoryDto,
  SkillAdminFilter,
  SkillRepository,
  SkillSearchFilter,
  UpdateSkillRepositoryDto,
} from '../../../domain/repositories/skill.repository.interface';
import type {
  Page,
  PageParams,
} from '../../../shared/pagination/pagination.util';
import { toSkip } from '../../../shared/pagination/pagination.util';
import { pickDefined } from '../../../shared/utils/pick-defined';
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
    // Autocompletar, no un listado paginado: se acota para que una búsqueda amplia (o vacía)
    // no traiga todo el catálogo a medida que crece.
    query.take(20);

    const skills = await query.getMany();
    return skills.map(toSkillEntity);
  }

  async findAllPaged(
    params: PageParams,
    filter: SkillAdminFilter = {},
  ): Promise<Page<SkillEntity>> {
    const query = this.repository.createQueryBuilder('skill');

    if (filter.normalizedQuery) {
      const like = `%${filter.normalizedQuery}%`;
      query.andWhere(
        '(skill.normalizedName LIKE :like OR EXISTS (SELECT 1 FROM unnest(skill.synonyms) s WHERE s LIKE :like))',
        { like },
      );
    }
    if (filter.type)
      query.andWhere('skill.type = :type', { type: filter.type });
    if (filter.category)
      query.andWhere('skill.category = :category', {
        category: filter.category,
      });
    if (filter.status)
      query.andWhere('skill.status = :status', { status: filter.status });

    query
      .orderBy('skill.name', 'ASC')
      .skip(toSkip(params.page, params.pageSize))
      .take(params.pageSize);

    const [skills, total] = await query.getManyAndCount();
    return { items: skills.map(toSkillEntity), total };
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

  async update(
    id: string,
    data: UpdateSkillRepositoryDto,
  ): Promise<SkillEntity | null> {
    const skill = await this.repository.findOne({ where: { id } });
    if (!skill) return null;

    const merged = this.repository.merge(skill, pickDefined(data));
    const saved = await this.repository.save(merged);
    return toSkillEntity(saved);
  }
}
