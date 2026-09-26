import { Inject, Injectable } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  EXPERIENCE_REPOSITORY,
  SKILL_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { ExperienceDto } from '../dto/experience.dto';
import { toExperienceResponse } from '../mappers/collaborator-response.mapper';
import { assertSkillsExist } from '../support/catalog-references';
import { assertValidExperiencePeriod } from '../support/experience-period';
import { findMyCollaboratorOrFail } from '../support/my-collaborator';

@Injectable()
export class CreateMyExperienceUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(EXPERIENCE_REPOSITORY)
    private readonly experienceRepository: ExperienceRepository,
    @Inject(SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
  ) {}

  async execute(userId: string, data: ExperienceDto) {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );
    const endDate = data.endDate ?? null;
    assertValidExperiencePeriod({
      startDate: data.startDate,
      endDate,
      current: data.current,
    });
    await assertSkillsExist(this.skillRepository, data.skillIds);

    const experience = await this.experienceRepository.create({
      collaboratorId: collaborator.id,
      type: data.type,
      role: data.role,
      organization: data.organization,
      startDate: data.startDate,
      endDate,
      current: data.current,
      weeklyHours: data.weeklyHours,
      level: data.level,
      description: data.description ?? null,
      skillIds: data.skillIds,
    });

    return toExperienceResponse(experience);
  }
}
