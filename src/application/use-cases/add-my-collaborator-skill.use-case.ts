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
export class AddMyCollaboratorSkillUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
    @Inject(COLLABORATOR_SKILL_REPOSITORY)
    private readonly collaboratorSkillRepository: CollaboratorSkillRepository,
  ) {}

  async execute(userId: string, data: CollaboratorSkillDto) {
    const collaborator = await this.collaboratorRepository.findByUserId(userId);
    if (!collaborator) {
      throw new NotFoundException({
        message: 'Perfil de colaborador no encontrado',
      });
    }

    const skill = await this.skillRepository.findById(data.skillId);
    if (!skill) {
      throw new NotFoundException({ message: 'Habilidad no encontrada' });
    }

    return this.collaboratorSkillRepository.create({
      collaboratorId: collaborator.id,
      skillId: data.skillId,
      level: data.level,
      experienceMonths: data.experienceMonths,
      lastUsedYear: data.lastUsedYear ?? null,
    });
  }
}
