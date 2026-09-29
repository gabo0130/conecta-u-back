import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectCategoryEntity } from '../../../domain/entities/project-category.entity';
import type {
  CreateProjectCategoryRepositoryDto,
  UpdateProjectCategoryRepositoryDto,
} from '../../../domain/repositories/project-category.repository.interface';
import { ProjectCategoryRepository } from '../../../domain/repositories/project-category.repository.interface';
import { pickDefined } from '../../../shared/utils/pick-defined';
import { ProjectCategoryOrmEntity } from './project-category.orm-entity';

@Injectable()
export class TypeOrmProjectCategoryRepository implements ProjectCategoryRepository {
  constructor(
    @InjectRepository(ProjectCategoryOrmEntity)
    private readonly repository: Repository<ProjectCategoryOrmEntity>,
  ) {}

  async findAll(onlyActive = true): Promise<ProjectCategoryEntity[]> {
    const categories = await this.repository.find({
      where: onlyActive ? { active: true } : {},
      order: { name: 'ASC' },
    });
    return categories.map((category) => this.toDomain(category));
  }

  async findById(id: string): Promise<ProjectCategoryEntity | null> {
    const category = await this.repository.findOne({ where: { id } });
    return category ? this.toDomain(category) : null;
  }

  async create(
    data: CreateProjectCategoryRepositoryDto,
  ): Promise<ProjectCategoryEntity> {
    const category = this.repository.create({ name: data.name });
    const saved = await this.repository.save(category);
    return this.toDomain(saved);
  }

  async update(
    id: string,
    data: UpdateProjectCategoryRepositoryDto,
  ): Promise<ProjectCategoryEntity | null> {
    const category = await this.repository.findOne({ where: { id } });
    if (!category) return null;

    const merged = this.repository.merge(category, pickDefined(data));
    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  private toDomain(category: ProjectCategoryOrmEntity): ProjectCategoryEntity {
    return new ProjectCategoryEntity(
      category.id,
      category.name,
      category.active,
    );
  }
}
