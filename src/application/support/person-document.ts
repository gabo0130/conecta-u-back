import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import {
  type DocumentType,
  documentNumberError,
} from '../../domain/entities/person-identification';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';

export const DOCUMENT_BELONGS_TO_OTHER =
  'El documento ya está registrado en otra persona';

/** El documento que llega en una actualización: puede venir solo el tipo o solo el número. */
export interface DocumentChange {
  documentType?: DocumentType;
  documentNumber?: string;
}

/**
 * Valida un cambio de documento de una persona: tipo y número juntos (el que no llega es el
 * guardado), formato según el tipo y que no sea de otra persona. Devuelve `true` si hay cambio.
 */
export async function assertDocumentChange(
  repository: CollaboratorRepository,
  person: CollaboratorEntity,
  change: DocumentChange,
): Promise<boolean> {
  if (
    change.documentType === undefined &&
    change.documentNumber === undefined
  ) {
    return false;
  }
  const documentType = change.documentType ?? person.documentType;
  const documentNumber = change.documentNumber ?? person.documentNumber;
  if (!documentType || !documentNumber) {
    throw new UnprocessableEntityException({
      message: 'Envía el tipo y el número de documento',
    });
  }
  const error = documentNumberError(documentType, documentNumber);
  if (error) throw new UnprocessableEntityException({ message: error });

  const owner = await repository.findByDocument(documentType, documentNumber);
  if (owner && owner.id !== person.id) {
    throw new ConflictException({ message: DOCUMENT_BELONGS_TO_OTHER });
  }
  return (
    documentType !== person.documentType ||
    documentNumber !== person.documentNumber
  );
}
