import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { requiresCertificate } from '../../domain/entities/experience-certificate';
import { ExperienceEntity } from '../../domain/entities/experience.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { SaveCertificateDto } from '../../domain/repositories/experience-certificate.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import type { UnitOfWork } from '../../domain/repositories/unit-of-work.interface';
import {
  COLLABORATOR_REPOSITORY,
  SKILL_REPOSITORY,
  UNIT_OF_WORK,
} from '../../shared/interfaces/tokens';
import { ExperienceDto } from '../dto/experience.dto';
import { toExperienceResponse } from '../mappers/collaborator-response.mapper';
import { assertSkillsExist } from '../support/catalog-references';
import { CertificateFiles } from '../support/certificate-files';
import {
  CERTIFICATE_REQUIRED_FOR_TYPE_MESSAGE,
  EXPERIENCE_NOT_FOUND,
  validateCertificate,
  type UploadedCertificate,
} from '../support/experience-certificate-file';
import { assertValidExperiencePeriod } from '../support/experience-period';
import { findMyCollaboratorOrFail } from '../support/my-collaborator';

/**
 * RF4: actualiza una experiencia propia y, si llega, reemplaza su certificado en la misma
 * operación. Una experiencia que pasa a laboral, de práctica o de docencia necesita certificado.
 */
@Injectable()
export class UpdateMyExperienceUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    private readonly certificateFiles: CertificateFiles,
  ) {}

  async execute(
    userId: string,
    id: string,
    data: ExperienceDto,
    file?: UploadedCertificate,
  ) {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );
    // Un 404 genérico también cuando la experiencia es de otro colaborador.
    const current = collaborator.experiences.find(
      (experience) => experience.id === id,
    );
    if (!current) {
      throw new NotFoundException({ message: EXPERIENCE_NOT_FOUND });
    }

    const endDate = data.endDate ?? null;
    assertValidExperiencePeriod({
      startDate: data.startDate,
      endDate,
      current: data.current,
    });
    await assertSkillsExist(this.skillRepository, data.skillIds);
    const certificate = file ? validateCertificate(file) : null;
    if (
      requiresCertificate(data.type) &&
      !certificate &&
      !current.certificate
    ) {
      throw new BadRequestException({
        message: CERTIFICATE_REQUIRED_FOR_TYPE_MESSAGE,
      });
    }
    const replacedKey = certificate
      ? await this.certificateFiles.keyOf(id)
      : null;

    const persist = (saved: SaveCertificateDto | null) =>
      this.unitOfWork.run(async (repositories) => {
        const experience = await repositories.experiences.update(id, {
          type: data.type,
          role: data.role,
          organization: data.organization,
          startDate: data.startDate,
          endDate,
          current: data.current,
          weeklyHours: data.weeklyHours,
          level: data.level,
          description: data.description ?? null,
          skillIds: data.skillIds,
        });
        if (!experience) {
          throw new NotFoundException({ message: EXPERIENCE_NOT_FOUND });
        }
        if (!saved) return experience;
        const info = await repositories.certificates.save(id, saved);
        return new ExperienceEntity({ ...experience, certificate: info });
      });
    const updated = certificate
      ? await this.certificateFiles.withUploaded(
          collaborator.id,
          certificate,
          persist,
        )
      : await persist(null);
    await this.certificateFiles.discard(replacedKey);

    return toExperienceResponse(updated);
  }
}
