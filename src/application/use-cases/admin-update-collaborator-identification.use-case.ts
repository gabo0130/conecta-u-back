import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ALTERNATE_EMAIL_SAME_ERROR,
  isSameEmail,
} from '../../domain/entities/person-identification';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import { COLLABORATOR_REPOSITORY } from '../../shared/interfaces/tokens';
import { pickDefined } from '../../shared/utils/pick-defined';
import { UpdateIdentificationDto } from '../dto/person-identification.dto';
import { assertDocumentChange } from '../support/person-document';
import { AdminGetCollaboratorUseCase } from './admin-get-collaborator.use-case';

export { DOCUMENT_BELONGS_TO_OTHER } from '../support/person-document';

/**
 * ADMIN (v2.1): corrige la identificación y el contacto de cualquier persona, con o sin cuenta.
 * Es el único que puede cambiar un documento ya guardado (evita suplantaciones) y así completa
 * los datos de quienes se registraron o importaron antes de v2.1.
 */
@Injectable()
export class AdminUpdateCollaboratorIdentificationUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    private readonly getCollaborator: AdminGetCollaboratorUseCase,
  ) {}

  async execute(collaboratorId: string, data: UpdateIdentificationDto) {
    const collaborator =
      await this.collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    if (isSameEmail(data.alternateEmail, collaborator.email)) {
      throw new UnprocessableEntityException({
        message: ALTERNATE_EMAIL_SAME_ERROR,
      });
    }
    await assertDocumentChange(this.collaboratorRepository, collaborator, data);

    await this.collaboratorRepository.update(
      collaborator.id,
      pickDefined(data),
    );
    return this.getCollaborator.execute(collaborator.id);
  }
}
