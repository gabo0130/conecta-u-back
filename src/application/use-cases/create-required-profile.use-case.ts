import { Inject, Injectable } from '@nestjs/common';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  PROJECT_REPOSITORY,
  REQUIRED_PROFILE_REPOSITORY,
  SKILL_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { ProfileEmbedder } from '../analysis/profile-embedder';
import type { CreateRequiredProfileDto } from '../dto/required-profile.dto';
import { toRequiredProfileResponse } from '../mappers/analysis-response.mapper';
import { loadOwnedProject } from '../support/project-access';
import { resolveProfileSkills } from '../support/required-profile-skills';

/** RF13: el líder dueño agrega a mano un perfil requerido (queda marcado como MANUAL). */
@Injectable()
export class CreateRequiredProfileUseCase {
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
    dto: CreateRequiredProfileDto,
  ) {
    await loadOwnedProject(this.projectRepository, userId, projectId);
    const skills = await resolveProfileSkills(this.skillRepository, dto.skills);
    const description = dto.description ?? '';

    const [embedding] = await this.profileEmbedder.embed([
      { name: dto.name, description, skills },
    ]);

    const profile = await this.requiredProfileRepository.createManual({
      projectId,
      name: dto.name,
      description,
      justification: dto.justification ?? '',
      quantity: dto.quantity,
      priority: dto.priority,
      minWeeklyHours: dto.minWeeklyHours ?? null,
      skills,
      embedding,
    });
    return toRequiredProfileResponse(profile);
  }
}
