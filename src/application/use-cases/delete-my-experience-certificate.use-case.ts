import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { requiresCertificate } from '../../domain/entities/experience-certificate';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceCertificateRepository } from '../../domain/repositories/experience-certificate.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  EXPERIENCE_CERTIFICATE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { CertificateFiles } from '../support/certificate-files';
import {
  CERTIFICATE_LOCKED_MESSAGE,
  certificateNotFound,
  EXPERIENCE_NOT_FOUND,
} from '../support/experience-certificate-file';
import { findMyCollaboratorOrFail } from '../support/my-collaborator';

/**
 * Quita el certificado de una experiencia propia. La laboral, de práctica y de docencia no
 * pueden quedar sin soporte (v2.2, E8): ahí solo se permite reemplazarlo.
 */
@Injectable()
export class DeleteMyExperienceCertificateUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(EXPERIENCE_CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: ExperienceCertificateRepository,
    private readonly certificateFiles: CertificateFiles,
  ) {}

  async execute(userId: string, experienceId: string): Promise<void> {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );
    const experience = collaborator.experiences.find(
      (item) => item.id === experienceId,
    );
    if (!experience) {
      throw new NotFoundException({ message: EXPERIENCE_NOT_FOUND });
    }
    if (requiresCertificate(experience.type)) {
      throw new UnprocessableEntityException({
        message: CERTIFICATE_LOCKED_MESSAGE,
      });
    }
    const storageKey = await this.certificateFiles.keyOf(experienceId);
    if (!(await this.certificateRepository.delete(experienceId))) {
      throw certificateNotFound();
    }
    await this.certificateFiles.discard(storageKey);
  }
}
