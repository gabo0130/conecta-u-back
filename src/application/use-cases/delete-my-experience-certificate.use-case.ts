import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceCertificateRepository } from '../../domain/repositories/experience-certificate.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  EXPERIENCE_CERTIFICATE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import {
  certificateNotFound,
  EXPERIENCE_NOT_FOUND,
} from '../support/experience-certificate-file';
import { findMyCollaboratorOrFail } from '../support/my-collaborator';

@Injectable()
export class DeleteMyExperienceCertificateUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(EXPERIENCE_CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: ExperienceCertificateRepository,
  ) {}

  async execute(userId: string, experienceId: string): Promise<void> {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );
    if (!collaborator.experiences.some((item) => item.id === experienceId)) {
      throw new NotFoundException({ message: EXPERIENCE_NOT_FOUND });
    }
    if (!(await this.certificateRepository.delete(experienceId))) {
      throw certificateNotFound();
    }
  }
}
