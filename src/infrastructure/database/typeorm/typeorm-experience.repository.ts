import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExperienceEntity } from '../../../domain/entities/experience.entity';
import {
  CreateExperienceRepositoryDto,
  ExperienceRepository,
  UpdateExperienceRepositoryDto,
} from '../../../domain/repositories/experience.repository.interface';
import { ExperienceOrmEntity } from './experience.orm-entity';
import { toExperienceEntity } from './mappers/collaborator.mapper';
import { pickDefined } from '../../../shared/utils/pick-defined';
import { markEmbeddingStale } from './mark-embedding-stale';
import { SkillOrmEntity } from './skill.orm-entity';

@Injectable()
export class TypeOrmExperienceRepository implements ExperienceRepository {
  constructor(
    @InjectRepository(ExperienceOrmEntity)
    private readonly repository: Repository<ExperienceOrmEntity>,
    @InjectRepository(SkillOrmEntity)
    private readonly skillRepository: Repository<SkillOrmEntity>,
  ) {}

  async findById(id: string): Promise<ExperienceEntity | null> {
    const experience = await this.repository.findOne({
      where: { id },
      relations: ['technologies'],
    });
    return experience ? toExperienceEntity(experience) : null;
  }

  async findByCollaboratorId(
    collaboratorId: string,
  ): Promise<ExperienceEntity[]> {
    const experiences = await this.repository.find({
      where: { collaboratorId },
      relations: ['technologies'],
    });
    return experiences.map(toExperienceEntity);
  }

  async create(data: CreateExperienceRepositoryDto): Promise<ExperienceEntity> {
    const technologies = await this.resolveSkills(data.skillIds);

    const experience = this.repository.create({
      collaboratorId: data.collaboratorId,
      type: data.type,
      role: data.role,
      organization: data.organization,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      current: data.current ?? false,
      weeklyHours: data.weeklyHours,
      level: data.level,
      description: data.description ?? null,
      technologies,
    });

    const saved = await this.repository.save(experience);
    await markEmbeddingStale(this.repository.manager, data.collaboratorId);
    return this.findById(saved.id) as Promise<ExperienceEntity>;
  }

  async update(
    id: string,
    data: UpdateExperienceRepositoryDto,
  ): Promise<ExperienceEntity | null> {
    const experience = await this.repository.findOne({
      where: { id },
      relations: ['technologies'],
    });
    if (!experience) {
      return null;
    }

    const { skillIds, ...columns } = data;
    const merged = this.repository.merge(experience, pickDefined(columns));

    // Las tecnologías se asignan fuera de merge(): merge combina arreglos por posición con los
    // cargados de la BD y conservaba las tecnologías quitadas.
    if (skillIds !== undefined) {
      merged.technologies = await this.resolveSkills(skillIds);
    }

    const saved = await this.repository.save(merged);
    await markEmbeddingStale(
      this.repository.manager,
      experience.collaboratorId,
    );
    return this.findById(saved.id);
  }

  async delete(id: string): Promise<boolean> {
    const experience = await this.repository.findOne({ where: { id } });
    if (!experience) {
      return false;
    }
    const result = await this.repository.delete(id);
    await markEmbeddingStale(
      this.repository.manager,
      experience.collaboratorId,
    );
    return (result.affected ?? 0) > 0;
  }

  private async resolveSkills(skillIds?: string[]): Promise<SkillOrmEntity[]> {
    if (!skillIds || skillIds.length === 0) {
      return [];
    }
    return this.skillRepository.find({ where: { id: In(skillIds) } });
  }
}
