import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import { COLLABORATOR_REPOSITORY } from '../../shared/interfaces/tokens';
import { AvailabilityDto } from '../dto/availability.dto';

@Injectable()
export class UpdateMyAvailabilityUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute(userId: string, data: AvailabilityDto) {
    const collaborator = await this.collaboratorRepository.findByUserId(userId);
    if (!collaborator) {
      throw new NotFoundException({
        message: 'Perfil de colaborador no encontrado',
      });
    }

    const updated = await this.collaboratorRepository.update(collaborator.id, {
      availabilityStatus: data.availabilityStatus,
      weeklyHours: data.weeklyHours,
    });

    if (!updated) {
      throw new NotFoundException({
        message: 'Perfil de colaborador no encontrado',
      });
    }

    return {
      availabilityStatus: updated.availabilityStatus,
      weeklyHours: updated.weeklyHours,
    };
  }
}
