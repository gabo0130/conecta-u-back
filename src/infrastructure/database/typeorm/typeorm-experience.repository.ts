import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExperienceEntity } from '../../../domain/entities/experience.entity';
import { SkillEntity } from '../../../domain/entities/skill.entity';
import {
  CreateExperienceRepositoryDto,
  ExperienceRepository,
  UpdateExperienceRepositoryDto,
} from '../../../domain/repositories/experience.repository.interface';
import { ExperienceOrmEntity } from './experience.orm-entity';
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
    return experience ? this.toDomain(experience) : null;
  }

  async findByCollaboratorId(
    collaboratorId: string,
  ): Promise<ExperienceEntity[]> {
    const experiences = await this.repository.find({
      where: { collaboratorId },
      relations: ['technologies'],
    });
    return experiences.map((experience) => this.toDomain(experience));
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

    const technologies =
      data.skillIds !== undefined
        ? await this.resolveSkills(data.skillIds)
        : experience.technologies;

    const merged = this.repository.merge(experience, {
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.organization !== undefined
        ? { organization: data.organization }
        : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      ...(data.current !== undefined ? { current: data.current } : {}),
      ...(data.weeklyHours !== undefined
        ? { weeklyHours: data.weeklyHours }
        : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      technologies,
    });

    const saved = await this.repository.save(merged);
    return this.findById(saved.id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private async resolveSkills(skillIds?: string[]): Promise<SkillOrmEntity[]> {
    if (!skillIds || skillIds.length === 0) {
      return [];
    }
    return this.skillRepository.find({ where: { id: In(skillIds) } });
  }

  private toDomain(experience: ExperienceOrmEntity): ExperienceEntity {
    return new ExperienceEntity(
      experience.id,
      experience.collaboratorId,
      experience.type as ExperienceEntity['type'],
      experience.role,
      experience.organization,
      experience.startDate,
      experience.endDate,
      experience.current,
      experience.weeklyHours,
      experience.level as ExperienceEntity['level'],
      experience.description,
      (experience.technologies ?? []).map(
        (skill) =>
          new SkillEntity(
            skill.id,
            skill.name,
            skill.normalizedName,
            skill.type as SkillEntity['type'],
            skill.category as SkillEntity['category'],
            skill.synonyms,
            skill.status as SkillEntity['status'],
          ),
      ),
    );
  }
}
