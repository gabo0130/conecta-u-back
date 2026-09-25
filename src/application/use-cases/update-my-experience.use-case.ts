import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  EXPERIENCE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { computeDurationMonths } from '../../shared/utils/compute-duration-months';
import { ExperienceDto } from '../dto/experience.dto';

@Injectable()
export class UpdateMyExperienceUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(EXPERIENCE_REPOSITORY)
    private readonly experienceRepository: ExperienceRepository,
  ) {}

  async execute(userId: string, id: string, data: ExperienceDto) {
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

    const updated = await this.experienceRepository.update(id, {
      type: data.type,
      role: data.role,
      organization: data.organization,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      current: data.current,
      weeklyHours: data.weeklyHours,
      level: data.level,
      description: data.description ?? null,
      skillIds: data.skillIds,
    });

    if (!updated) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    return {
      ...updated,
      durationMonths: computeDurationMonths(updated.startDate, updated.endDate),
    };
  }
}
