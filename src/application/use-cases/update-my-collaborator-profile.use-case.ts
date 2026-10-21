import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { consentFields } from '../../domain/entities/data-consent';
import {
  ALTERNATE_EMAIL_SAME_ERROR,
  isSameEmail,
} from '../../domain/entities/person-identification';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  PROGRAM_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { pickDefined } from '../../shared/utils/pick-defined';
import { UpdateCollaboratorDto } from '../dto/update-collaborator.dto';
import { toCollaboratorProfileResponse } from '../mappers/collaborator-response.mapper';
import { findProgramOrFail } from '../support/catalog-references';
import { assertDocumentChange } from '../support/person-document';
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

    if (isSameEmail(data.alternateEmail, collaborator.email)) {
      throw new UnprocessableEntityException({
        message: ALTERNATE_EMAIL_SAME_ERROR,
      });
    }
    const changesDocument = await assertDocumentChange(
      this.collaboratorRepository,
      collaborator,
      data,
    );
    // Completar un documento que falta sí; cambiar uno guardado, solo el ADMIN (evita suplantación).
    if (changesDocument && collaborator.documentNumber) {
      throw new ForbiddenException({ message: DOCUMENT_CHANGE_FORBIDDEN });
    }
    if (data.programId !== undefined) {
      await findProgramOrFail(this.programRepository, data.programId);
    }

    const { dataConsent, ...fields } = data;
    const updated = await this.collaboratorRepository.update(collaborator.id, {
      ...pickDefined(fields),
      ...(dataConsent !== undefined ? consentFields(dataConsent) : {}),
    });

    if (!updated) {
      throw new NotFoundException({ message: COLLABORATOR_PROFILE_NOT_FOUND });
    }

    return toCollaboratorProfileResponse(updated);
  }
}

export const DOCUMENT_CHANGE_FORBIDDEN =
  'Solo el administrador puede cambiar tu documento. Escríbele si hay un error.';
