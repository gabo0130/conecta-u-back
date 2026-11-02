import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
  validateCertificate,
  type UploadedCertificate,
} from '../support/experience-certificate-file';
import { assertValidExperiencePeriod } from '../support/experience-period';
import { findMyCollaboratorOrFail } from '../support/my-collaborator';

/**
 * RF4: registra una experiencia propia. La laboral, de práctica y de docencia se guardan solo
 * con su certificado válido (v2.2, E8): el archivo se valida antes de escribir y la experiencia
 * y el certificado quedan juntos o no queda ninguno.
 */
@Injectable()
export class CreateMyExperienceUseCase {
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
    data: ExperienceDto,
    file?: UploadedCertificate,
  ) {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );
    const endDate = data.endDate ?? null;
    assertValidExperiencePeriod({
      startDate: data.startDate,
      endDate,
      current: data.current,
    });
    await assertSkillsExist(this.skillRepository, data.skillIds);
    const certificate = file ? validateCertificate(file) : null;
    if (requiresCertificate(data.type) && !certificate) {
      throw new BadRequestException({
        message: CERTIFICATE_REQUIRED_FOR_TYPE_MESSAGE,
      });
    }

    const persist = (saved: SaveCertificateDto | null) =>
      this.unitOfWork.run(async (repositories) => {
        const created = await repositories.experiences.create({
          collaboratorId: collaborator.id,
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
        if (!saved) return created;
        const info = await repositories.certificates.save(created.id, saved);
        return new ExperienceEntity({ ...created, certificate: info });
      });
    const experience = certificate
      ? await this.certificateFiles.withUploaded(
          collaborator.id,
          certificate,
          persist,
        )
      : await persist(null);

    return toExperienceResponse(experience);
  }
}
