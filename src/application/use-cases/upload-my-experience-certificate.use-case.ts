import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ExperienceEntity } from '../../domain/entities/experience.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceCertificateRepository } from '../../domain/repositories/experience-certificate.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  EXPERIENCE_CERTIFICATE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { toExperienceResponse } from '../mappers/collaborator-response.mapper';
import { CertificateFiles } from '../support/certificate-files';
import {
  EXPERIENCE_NOT_FOUND,
  validateCertificate,
  type UploadedCertificate,
} from '../support/experience-certificate-file';
import { findMyCollaboratorOrFail } from '../support/my-collaborator';

/** RF4 (v2.2, E8): adjunta o reemplaza el certificado de una experiencia propia. */
@Injectable()
export class UploadMyExperienceCertificateUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(EXPERIENCE_CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: ExperienceCertificateRepository,
    private readonly certificateFiles: CertificateFiles,
  ) {}

  async execute(
    userId: string,
    experienceId: string,
    file: UploadedCertificate | undefined,
  ) {
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
    const certificate = validateCertificate(file);
    const replacedKey = await this.certificateFiles.keyOf(experienceId);

    const info = await this.certificateFiles.withUploaded(
      collaborator.id,
      certificate,
      (saved) => this.certificateRepository.save(experienceId, saved),
    );
    await this.certificateFiles.discard(replacedKey);
    return toExperienceResponse(
      new ExperienceEntity({ ...experience, certificate: info }),
    );
  }
}
