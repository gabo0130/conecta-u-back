import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type {
  RequiredProfileRepository,
  UpdateRequiredProfileRepositoryDto,
} from '../../domain/repositories/required-profile.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  PROJECT_REPOSITORY,
  REQUIRED_PROFILE_REPOSITORY,
  SKILL_REPOSITORY,
} from '../../shared/interfaces/tokens';
import {
  ProfileEmbedder,
  toEmbeddableProfile,
} from '../analysis/profile-embedder';
import type { UpdateRequiredProfileDto } from '../dto/required-profile.dto';
import { toRequiredProfileResponse } from '../mappers/analysis-response.mapper';
import { loadOwnedProject } from '../support/project-access';
import { resolveProfileSkills } from '../support/required-profile-skills';

/**
 * RF13: el líder dueño edita un perfil (de la IA o manual) o lo descarta con `active: false`.
 * Si cambia lo que describe al perfil, se recalcula su embedding.
 */
@Injectable()
export class UpdateRequiredProfileUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(REQUIRED_PROFILE_REPOSITORY)
    private readonly requiredProfileRepository: RequiredProfileRepository,
    @Inject(SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
    private readonly profileEmbedder: ProfileEmbedder,
  ) {}

  async execute(
    userId: string,
    projectId: string,
    profileId: string,
    dto: UpdateRequiredProfileDto,
  ) {
    await loadOwnedProject(this.projectRepository, userId, projectId);
    const profile = await this.requiredProfileRepository.findById(profileId);
    if (profile?.projectId !== projectId) {
      throw new NotFoundException({ message: 'Perfil no encontrado' });
    }

    const { skills: skillItems, ...fields } = dto;
    const changes: UpdateRequiredProfileRepositoryDto = {
      ...fields,
      description:
        fields.description === undefined
          ? undefined
          : (fields.description ?? ''),
      justification:
        fields.justification === undefined
          ? undefined
          : (fields.justification ?? ''),
    };
    if (skillItems !== undefined) {
      changes.skills = await resolveProfileSkills(
        this.skillRepository,
        skillItems,
      );
    }

    if (
      changes.name !== undefined ||
      changes.description !== undefined ||
      changes.skills !== undefined
    ) {
      const [embedding] = await this.profileEmbedder.embed([
        {
          name: changes.name ?? profile.name,
          description: changes.description ?? profile.description,
          skills: changes.skills ?? toEmbeddableProfile(profile).skills,
        },
      ]);
      changes.embedding = embedding;
    }

    const updated = await this.requiredProfileRepository.update(
      profileId,
      changes,
    );
    if (!updated) {
      throw new NotFoundException({ message: 'Perfil no encontrado' });
    }
    return toRequiredProfileResponse(updated);
  }
}
