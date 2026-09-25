import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTypeEntity } from '../../../domain/entities/project-type.entity';
import { ProjectTypeRepository } from '../../../domain/repositories/project-type.repository.interface';
import { ProjectTypeOrmEntity } from './project-type.orm-entity';

@Injectable()
export class TypeOrmProjectTypeRepository implements ProjectTypeRepository {
  constructor(
    @InjectRepository(ProjectTypeOrmEntity)
    private readonly repository: Repository<ProjectTypeOrmEntity>,
  ) {}

  async findAll(onlyActive = true): Promise<ProjectTypeEntity[]> {
    const types = await this.repository.find({
      where: onlyActive ? { active: true } : {},
      order: { name: 'ASC' },
    });
    return types.map((type) => this.toDomain(type));
  }

  async findById(id: string): Promise<ProjectTypeEntity | null> {
    const type = await this.repository.findOne({ where: { id } });
    return type ? this.toDomain(type) : null;
  }

  private toDomain(type: ProjectTypeOrmEntity): ProjectTypeEntity {
    return new ProjectTypeEntity(
      type.id,
      type.code,
      type.name,
      type.templateFields,
      type.active,
    );
  }
}
