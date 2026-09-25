import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorSkillRepository } from '../../domain/repositories/collaborator-skill.repository.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  COLLABORATOR_SKILL_REPOSITORY,
} from '../../shared/interfaces/tokens';

@Injectable()
export class DeleteMyCollaboratorSkillUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(COLLABORATOR_SKILL_REPOSITORY)
    private readonly collaboratorSkillRepository: CollaboratorSkillRepository,
  ) {}

  async execute(userId: string, id: string) {
    const collaborator = await this.collaboratorRepository.findByUserId(userId);
    const entry = collaborator
      ? await this.collaboratorSkillRepository.findById(id)
      : null;

    if (!collaborator || !entry || entry.collaboratorId !== collaborator.id) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    await this.collaboratorSkillRepository.delete(id);
  }
}
