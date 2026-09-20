import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollaboratorEntity } from '../../../domain/entities/collaborator.entity';
import { ExperienceEntity } from '../../../domain/entities/experience.entity';
import { SkillEntity } from '../../../domain/entities/skill.entity';
import {
  CollaboratorRepository,
  type UpdateCollaboratorRepositoryDto,
} from '../../../domain/repositories/collaborator.repository.interface';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { ExperienceOrmEntity } from './experience.orm-entity';
import { SkillOrmEntity } from './skill.orm-entity';

@Injectable()
export class TypeOrmCollaboratorRepository implements CollaboratorRepository {
  constructor(
    @InjectRepository(CollaboratorOrmEntity)
    private readonly repository: Repository<CollaboratorOrmEntity>,
  ) {}

  async findByUserId(userId: string): Promise<CollaboratorEntity | null> {
    const collaborator = await this.repository.findOne({
      where: { userId },
      relations: ['skills', 'experiences'],
    });

    return collaborator ? this.toDomain(collaborator) : null;
  }

  async update(
    userId: string,
    data: UpdateCollaboratorRepositoryDto,
  ): Promise<CollaboratorEntity | null> {
    const collaborator = await this.repository.findOne({
      where: { userId },
      relations: ['skills', 'experiences'],
    });
    if (!collaborator) {
      return null;
    }

    const merged = this.repository.merge(collaborator, {
      ...(data.headline !== undefined ? { headline: data.headline } : {}),
      ...(data.studyGroup !== undefined ? { studyGroup: data.studyGroup } : {}),
      ...(data.availabilityStatus !== undefined
        ? { availabilityStatus: data.availabilityStatus }
        : {}),
      ...(data.weeklyHours !== undefined
        ? { weeklyHours: data.weeklyHours }
        : {}),
      ...(data.modality !== undefined ? { modality: data.modality } : {}),
    });

    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  private toDomain(collaborator: CollaboratorOrmEntity): CollaboratorEntity {
    return new CollaboratorEntity(
      collaborator.userId,
      collaborator.headline,
      collaborator.availabilityStatus as CollaboratorEntity['availabilityStatus'],
      collaborator.weeklyHours,
      collaborator.modality,
      (collaborator.skills ?? []).map(
        (skill: SkillOrmEntity) =>
          new SkillEntity(
            skill.id,
            skill.collaboratorId,
            skill.name,
            skill.type as SkillEntity['type'],
            skill.level,
          ),
      ),
      (collaborator.experiences ?? []).map(
        (experience: ExperienceOrmEntity) =>
          new ExperienceEntity(
            experience.id,
            experience.collaboratorId,
            experience.title,
            experience.organization,
            experience.period,
            experience.description,
          ),
      ),
      collaborator.studyGroup,
    );
  }
}
