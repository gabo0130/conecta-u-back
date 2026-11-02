import {
  ConflictException,
  Inject,
  Injectable,
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
import { AdminCreatePersonDto } from '../dto/admin-person.dto';
import { findProgramOrFail } from '../support/catalog-references';
import { DOCUMENT_BELONGS_TO_OTHER } from '../support/person-document';
import { AdminGetCollaboratorUseCase } from './admin-get-collaborator.use-case';

export const PERSON_EMAIL_TAKEN =
  'El correo ya está registrado en otra persona';

/**
 * RF17 (HU-15): el ADMIN registra una persona sin cuenta. Queda con origen `ADMIN` y sin la
 * declaración de veracidad (la hace la propia persona si después crea su cuenta). Solo se
 * recomienda si tiene la autorización de datos.
 */
@Injectable()
export class AdminCreatePersonUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
    private readonly getCollaborator: AdminGetCollaboratorUseCase,
  ) {}

  async execute(data: AdminCreatePersonDto) {
    if (isSameEmail(data.alternateEmail, data.email)) {
      throw new UnprocessableEntityException({
        message: ALTERNATE_EMAIL_SAME_ERROR,
      });
    }
    if (await this.collaboratorRepository.findByEmail(data.email)) {
      throw new ConflictException({ message: PERSON_EMAIL_TAKEN });
    }
    if (
      await this.collaboratorRepository.findByDocument(
        data.documentType,
        data.documentNumber,
      )
    ) {
      throw new ConflictException({ message: DOCUMENT_BELONGS_TO_OTHER });
    }
    await findProgramOrFail(this.programRepository, data.programId);

    const { dataConsent, ...person } = data;
    const created = await this.collaboratorRepository.create({
      ...person,
      userId: null,
      source: 'ADMIN',
      ...(dataConsent !== undefined ? consentFields(dataConsent) : {}),
    });
    return this.getCollaborator.execute(created.id);
  }
}
