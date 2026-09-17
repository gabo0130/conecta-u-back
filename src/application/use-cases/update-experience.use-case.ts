import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import { EXPERIENCE_REPOSITORY } from '../../shared/interfaces/tokens';
import { ExperienceDto } from '../dto/experience.dto';

@Injectable()
export class UpdateExperienceUseCase {
  constructor(
    @Inject(EXPERIENCE_REPOSITORY)
    private readonly experienceRepository: ExperienceRepository,
  ) {}

  async execute(userId: string, experienceId: string, data: ExperienceDto) {
    const experience = await this.experienceRepository.findById(experienceId);
    if (!experience || experience.collaboratorId !== userId) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    const updated = await this.experienceRepository.update(experienceId, {
      title: data.title,
      organization: data.organization ?? null,
      period: data.period ?? null,
      description: data.description ?? null,
    });

    if (!updated) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    return updated;
  }
}
