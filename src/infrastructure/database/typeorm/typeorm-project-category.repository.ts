import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectCategoryEntity } from '../../../domain/entities/project-category.entity';
import { ProjectCategoryRepository } from '../../../domain/repositories/project-category.repository.interface';
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

  private toDomain(category: ProjectCategoryOrmEntity): ProjectCategoryEntity {
    return new ProjectCategoryEntity(
      category.id,
      category.name,
      category.active,
    );
  }
}
