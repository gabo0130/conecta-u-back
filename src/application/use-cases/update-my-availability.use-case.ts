import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import { COLLABORATOR_REPOSITORY } from '../../shared/interfaces/tokens';
import { AvailabilityDto } from '../dto/availability.dto';
import {
  COLLABORATOR_PROFILE_NOT_FOUND,
  findMyCollaboratorOrFail,
} from '../support/my-collaborator';

@Injectable()
export class UpdateMyAvailabilityUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute(userId: string, data: AvailabilityDto) {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );

    const updated = await this.collaboratorRepository.update(collaborator.id, {
      availabilityStatus: data.availabilityStatus,
      weeklyHours: data.weeklyHours,
    });

    if (!updated) {
      throw new NotFoundException({ message: COLLABORATOR_PROFILE_NOT_FOUND });
    }

    return {
      availabilityStatus: updated.availabilityStatus,
      weeklyHours: updated.weeklyHours,
    };
  }
}
