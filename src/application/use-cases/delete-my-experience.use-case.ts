import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  EXPERIENCE_REPOSITORY,
} from '../../shared/interfaces/tokens';

@Injectable()
export class DeleteMyExperienceUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(EXPERIENCE_REPOSITORY)
    private readonly experienceRepository: ExperienceRepository,
  ) {}

  async execute(userId: string, id: string) {
    const collaborator = await this.collaboratorRepository.findByUserId(userId);
    const experience = collaborator
      ? await this.experienceRepository.findById(id)
      : null;

    if (
      !collaborator ||
      !experience ||
      experience.collaboratorId !== collaborator.id
    ) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    await this.experienceRepository.delete(id);
  }
}
