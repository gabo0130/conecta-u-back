import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  EXPERIENCE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { CertificateFiles } from '../support/certificate-files';
import { EXPERIENCE_NOT_FOUND } from '../support/experience-certificate-file';
import { findMyCollaboratorOrFail } from '../support/my-collaborator';

@Injectable()
export class DeleteMyExperienceUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(EXPERIENCE_REPOSITORY)
    private readonly experienceRepository: ExperienceRepository,
    private readonly certificateFiles: CertificateFiles,
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );

    if (!collaborator.experiences.some((experience) => experience.id === id)) {
      throw new NotFoundException({ message: EXPERIENCE_NOT_FOUND });
    }

    // La fila del certificado se borra en cascada; el archivo del bucket, después.
    const storageKey = await this.certificateFiles.keyOf(id);
    await this.experienceRepository.delete(id);
    await this.certificateFiles.discard(storageKey);
  }
}
