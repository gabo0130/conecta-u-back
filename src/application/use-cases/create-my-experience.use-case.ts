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
export class CreateMyExperienceUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(EXPERIENCE_REPOSITORY)
    private readonly experienceRepository: ExperienceRepository,
  ) {}

  async execute(userId: string, data: ExperienceDto) {
    const collaborator = await this.collaboratorRepository.findByUserId(userId);
    if (!collaborator) {
      throw new NotFoundException({
        message: 'Perfil de colaborador no encontrado',
      });
    }

    const experience = await this.experienceRepository.create({
      collaboratorId: collaborator.id,
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

    return {
      ...experience,
      durationMonths: computeDurationMonths(
        experience.startDate,
        experience.endDate,
      ),
    };
  }
}
