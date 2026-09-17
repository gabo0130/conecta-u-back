import { Inject, Injectable } from '@nestjs/common';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import { EXPERIENCE_REPOSITORY } from '../../shared/interfaces/tokens';
import { ExperienceDto } from '../dto/experience.dto';

@Injectable()
export class CreateExperienceUseCase {
  constructor(
    @Inject(EXPERIENCE_REPOSITORY)
    private readonly experienceRepository: ExperienceRepository,
  ) {}

  async execute(userId: string, data: ExperienceDto) {
    return this.experienceRepository.create({
      collaboratorId: userId,
      title: data.title,
      organization: data.organization ?? null,
      period: data.period ?? null,
      description: data.description ?? null,
    });
  }
}
