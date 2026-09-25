import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorSkillRepository } from '../../domain/repositories/collaborator-skill.repository.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  COLLABORATOR_SKILL_REPOSITORY,
  SKILL_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { CollaboratorSkillDto } from '../dto/collaborator-skill.dto';

@Injectable()
export class UpdateMyCollaboratorSkillUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
    @Inject(COLLABORATOR_SKILL_REPOSITORY)
    private readonly collaboratorSkillRepository: CollaboratorSkillRepository,
  ) {}

  async execute(userId: string, id: string, data: CollaboratorSkillDto) {
    const collaborator = await this.collaboratorRepository.findByUserId(userId);
    const entry = collaborator
      ? await this.collaboratorSkillRepository.findById(id)
      : null;

    if (!collaborator || !entry || entry.collaboratorId !== collaborator.id) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    const skill = await this.skillRepository.findById(data.skillId);
    if (!skill) {
      throw new NotFoundException({ message: 'Habilidad no encontrada' });
    }

    return this.collaboratorSkillRepository.update(id, {
      skillId: data.skillId,
      level: data.level,
      experienceMonths: data.experienceMonths,
      lastUsedYear: data.lastUsedYear ?? null,
    });
  }
}
