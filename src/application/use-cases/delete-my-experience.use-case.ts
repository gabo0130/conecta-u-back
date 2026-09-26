import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  EXPERIENCE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { findMyCollaboratorOrFail } from '../support/my-collaborator';

@Injectable()
export class DeleteMyExperienceUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(EXPERIENCE_REPOSITORY)
    private readonly experienceRepository: ExperienceRepository,
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );

    if (!collaborator.experiences.some((experience) => experience.id === id)) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    await this.experienceRepository.delete(id);
  }
}
