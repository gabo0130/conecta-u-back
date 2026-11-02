import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type {
  CertificateFile,
  ExperienceCertificateRepository,
} from '../../domain/repositories/experience-certificate.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  EXPERIENCE_CERTIFICATE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import {
  certificateNotFound,
  EXPERIENCE_NOT_FOUND,
} from '../support/experience-certificate-file';
import { findMyCollaboratorOrFail } from '../support/my-collaborator';

/**
 * Descarga del certificado (RT16, acceso restringido): la propia persona (`forOwner`) o el
 * ADMIN (`forAdmin`, cualquier persona). El líder nunca llega aquí.
 */
@Injectable()
export class GetExperienceCertificateUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(EXPERIENCE_CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: ExperienceCertificateRepository,
  ) {}

  async forOwner(
    userId: string,
    experienceId: string,
  ): Promise<CertificateFile> {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );
    return this.read(collaborator, experienceId);
  }

  async forAdmin(
    collaboratorId: string,
    experienceId: string,
  ): Promise<CertificateFile> {
    const collaborator =
      await this.collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      throw new NotFoundException({ message: EXPERIENCE_NOT_FOUND });
    }
    return this.read(collaborator, experienceId);
  }

  private async read(
    collaborator: CollaboratorEntity,
    experienceId: string,
  ): Promise<CertificateFile> {
    if (!collaborator.experiences.some((item) => item.id === experienceId)) {
      throw new NotFoundException({ message: EXPERIENCE_NOT_FOUND });
    }
    const file = await this.certificateRepository.findFile(experienceId);
    if (!file) throw certificateNotFound();
    return file;
  }
}
