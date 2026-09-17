import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExperienceEntity } from '../../../domain/entities/experience.entity';
import {
  CreateExperienceRepositoryDto,
  ExperienceRepository,
  UpdateExperienceRepositoryDto,
} from '../../../domain/repositories/experience.repository.interface';
import { ExperienceOrmEntity } from './experience.orm-entity';

@Injectable()
export class TypeOrmExperienceRepository implements ExperienceRepository {
  constructor(
    @InjectRepository(ExperienceOrmEntity)
    private readonly repository: Repository<ExperienceOrmEntity>,
  ) {}

  async findById(id: string): Promise<ExperienceEntity | null> {
    const experience = await this.repository.findOne({ where: { id } });
    return experience ? this.toDomain(experience) : null;
  }

  async findByCollaboratorId(
    collaboratorId: string,
  ): Promise<ExperienceEntity[]> {
    const experiences = await this.repository.find({
      where: { collaboratorId },
    });
    return experiences.map((experience) => this.toDomain(experience));
  }

  async create(data: CreateExperienceRepositoryDto): Promise<ExperienceEntity> {
    const experience = this.repository.create({
      collaboratorId: data.collaboratorId,
      title: data.title,
      organization: data.organization ?? null,
      period: data.period ?? null,
      description: data.description ?? null,
    });

    const saved = await this.repository.save(experience);
    return this.toDomain(saved);
  }

  async update(
    id: string,
    data: UpdateExperienceRepositoryDto,
  ): Promise<ExperienceEntity | null> {
    const experience = await this.repository.findOne({ where: { id } });
    if (!experience) {
      return null;
    }

    const merged = this.repository.merge(experience, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.organization !== undefined
        ? { organization: data.organization }
        : {}),
      ...(data.period !== undefined ? { period: data.period } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
    });

    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private toDomain(experience: ExperienceOrmEntity): ExperienceEntity {
    return new ExperienceEntity(
      experience.id,
      experience.collaboratorId,
      experience.title,
      experience.organization,
      experience.period,
      experience.description,
    );
  }
}
