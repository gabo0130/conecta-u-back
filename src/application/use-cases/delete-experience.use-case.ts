import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import { EXPERIENCE_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class DeleteExperienceUseCase {
  constructor(
    @Inject(EXPERIENCE_REPOSITORY)
    private readonly experienceRepository: ExperienceRepository,
  ) {}

  async execute(userId: string, experienceId: string): Promise<void> {
    const experience = await this.experienceRepository.findById(experienceId);
    if (!experience || experience.collaboratorId !== userId) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    await this.experienceRepository.delete(experienceId);
  }
}
