import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import { COLLABORATOR_REPOSITORY } from '../../shared/interfaces/tokens';
import { AvailabilityDto } from '../dto/availability.dto';

@Injectable()
export class UpdateAvailabilityUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute(userId: string, data: AvailabilityDto) {
    const updated = await this.collaboratorRepository.update(userId, {
      ...(data.availabilityStatus !== undefined
        ? { availabilityStatus: data.availabilityStatus }
        : {}),
      ...(data.weeklyHours !== undefined
        ? { weeklyHours: data.weeklyHours }
        : {}),
      ...(data.modality !== undefined ? { modality: data.modality } : {}),
    });

    if (!updated) {
      throw new NotFoundException({
        message: 'Perfil de colaborador no encontrado',
      });
    }

    return {
      availabilityStatus: updated.availabilityStatus,
      weeklyHours: updated.weeklyHours,
      modality: updated.modality,
    };
  }
}
