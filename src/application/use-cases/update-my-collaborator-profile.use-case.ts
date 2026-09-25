import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import { COLLABORATOR_REPOSITORY } from '../../shared/interfaces/tokens';
import { UpdateCollaboratorDto } from '../dto/update-collaborator.dto';

@Injectable()
export class UpdateMyCollaboratorProfileUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute(userId: string, data: UpdateCollaboratorDto) {
    const collaborator = await this.collaboratorRepository.findByUserId(userId);
    if (!collaborator) {
      throw new NotFoundException({
        message: 'Perfil de colaborador no encontrado',
      });
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
        ? {
            dataConsent: data.dataConsent,
            dataConsentAt: data.dataConsent ? new Date() : null,
          }
        : {}),
    });

    if (!updated) {
      throw new NotFoundException({
        message: 'Perfil de colaborador no encontrado',
      });
    }

    return {
      firstName: updated.firstName,
      lastName: updated.lastName,
      programId: updated.programId,
      semester: updated.semester,
      researchGroup: updated.researchGroup,
      summary: updated.summary,
      profileUrl: updated.profileUrl,
      dataConsent: updated.dataConsent,
    };
  }
}
