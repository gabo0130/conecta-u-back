import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { consentFields } from '../../domain/entities/data-consent';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  PROGRAM_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { UpdateCollaboratorDto } from '../dto/update-collaborator.dto';
import { toCollaboratorProfileResponse } from '../mappers/collaborator-response.mapper';
import { findProgramOrFail } from '../support/catalog-references';
import {
  COLLABORATOR_PROFILE_NOT_FOUND,
  findMyCollaboratorOrFail,
} from '../support/my-collaborator';

@Injectable()
export class UpdateMyCollaboratorProfileUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
  ) {}

  async execute(userId: string, data: UpdateCollaboratorDto) {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );

    if (data.programId !== undefined) {
      await findProgramOrFail(this.programRepository, data.programId);
    }

    const updated = await this.collaboratorRepository.update(collaborator.id, {
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      ...(data.programId !== undefined ? { programId: data.programId } : {}),
      ...(data.semester !== undefined ? { semester: data.semester } : {}),
      ...(data.researchGroup !== undefined
        ? { researchGroup: data.researchGroup }
        : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.profileUrl !== undefined ? { profileUrl: data.profileUrl } : {}),
      ...(data.dataConsent !== undefined
        ? consentFields(data.dataConsent)
        : {}),
    });

    if (!updated) {
      throw new NotFoundException({ message: COLLABORATOR_PROFILE_NOT_FOUND });
    }

    return toCollaboratorProfileResponse(updated);
  }
}
