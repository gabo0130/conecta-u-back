import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import { COLLABORATOR_REPOSITORY } from '../../shared/interfaces/tokens';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute(userId: string, data: UpdateProfileDto) {
    const updated = await this.collaboratorRepository.update(userId, {
      ...(data.headline !== undefined ? { headline: data.headline } : {}),
      ...(data.studyGroup !== undefined ? { studyGroup: data.studyGroup } : {}),
    });

    if (!updated) {
      throw new NotFoundException({
        message: 'Perfil de colaborador no encontrado',
      });
    }

    return {
      headline: updated.headline,
      studyGroup: updated.studyGroup,
      availabilityStatus: updated.availabilityStatus,
      weeklyHours: updated.weeklyHours,
      modality: updated.modality,
    };
  }
}
