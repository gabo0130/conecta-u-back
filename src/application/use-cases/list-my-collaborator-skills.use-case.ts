import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import { COLLABORATOR_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class ListMyCollaboratorSkillsUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute(userId: string) {
    const collaborator = await this.collaboratorRepository.findByUserId(userId);
    if (!collaborator) {
      throw new NotFoundException({
        message: 'Perfil de colaborador no encontrado',
      });
    }

    return {
      skills: collaborator.skills.map((entry) => ({
        id: entry.id,
        skill: {
          id: entry.skill.id,
          name: entry.skill.name,
          type: entry.skill.type,
          category: entry.skill.category,
        },
        level: entry.level,
        experienceMonths: entry.experienceMonths,
        lastUsedYear: entry.lastUsedYear,
      })),
    };
  }
}
