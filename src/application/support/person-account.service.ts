import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { consentFields } from '../../domain/entities/data-consent';
import {
  ALTERNATE_EMAIL_SAME_ERROR,
  type PersonIdentification,
  isSameEmail,
} from '../../domain/entities/person-identification';
import type { PersonType } from '../../domain/entities/person-type.type';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { TransactionalRepositories } from '../../domain/repositories/unit-of-work.interface';
import {
  COLLABORATOR_REPOSITORY,
  PROGRAM_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { findProgramOrFail } from './catalog-references';

/** Datos de la persona que llegan al crear una cuenta o el propio perfil. */
export interface PersonForAccount extends Omit<
  PersonIdentification,
  'alternateEmail' | 'institutionalCode'
> {
  alternateEmail?: string | null;
  institutionalCode?: string | null;
  firstName: string;
  lastName: string;
  personType: PersonType;
  programId: string;
  /** Solo se toca el consentimiento si llega (clientes antiguos no lo mandan). */
  dataConsent?: boolean;
  /** Campos extra del perfil técnico al crearlo desde "Mi perfil". */
  profile?: {
    semester?: number | null;
    researchGroup?: string | null;
    summary?: string | null;
    profileUrl?: string | null;
  };
}

/** Lo que se decidió antes de abrir la transacción: vincular una persona existente o crearla. */
export type PendingPerson =
  | { kind: 'link'; existing: CollaboratorEntity; person: PersonForAccount }
  | { kind: 'create'; email: string; person: PersonForAccount };

export const DOCUMENT_TAKEN = 'El documento ya está registrado en otra cuenta';
export const DOCUMENT_WITH_OTHER_EMAIL =
  'El documento ya está registrado con otro correo. Pide al administrador que lo revise.';
export const EMAIL_TAKEN = 'Este correo ya está vinculado a una cuenta';
export const EMAIL_WITH_OTHER_DOCUMENT =
  'El correo pertenece a una persona con otro documento. Pide al administrador que lo revise.';

/**
 * Toda cuenta queda vinculada a una persona (v2.1, decisión 3). Regla única para el
 * registro, la creación de usuarios por el ADMIN y "crear mi perfil":
 * 1. Si el documento ya existe: se vincula esa persona (p. ej. importada por Excel), salvo que
 *    ya tenga cuenta o esté registrada con otro correo.
 * 2. Si no, por correo: se vincula si la persona no tiene cuenta ni otro documento.
 * 3. Si no existe, se crea con un programa válido.
 */
@Injectable()
export class PersonAccountService {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
  ) {}

  /** Valida y decide sin escribir nada. */
  async prepare(
    email: string,
    person: PersonForAccount,
  ): Promise<PendingPerson> {
    if (isSameEmail(person.alternateEmail, email)) {
      throw new UnprocessableEntityException({
        message: ALTERNATE_EMAIL_SAME_ERROR,
      });
    }

    const byDocument = await this.collaboratorRepository.findByDocument(
      person.documentType,
      person.documentNumber,
    );
    if (byDocument) {
      if (byDocument.userId) {
        throw new ConflictException({ message: DOCUMENT_TAKEN });
      }
      if (!isSameEmail(byDocument.email, email)) {
        throw new ConflictException({ message: DOCUMENT_WITH_OTHER_EMAIL });
      }
      return { kind: 'link', existing: byDocument, person };
    }

    const byEmail = await this.collaboratorRepository.findByEmail(email);
    if (byEmail) {
      if (byEmail.userId) {
        throw new ConflictException({ message: EMAIL_TAKEN });
      }
      if (byEmail.documentNumber) {
        throw new ConflictException({ message: EMAIL_WITH_OTHER_DOCUMENT });
      }
      return { kind: 'link', existing: byEmail, person };
    }

    await findProgramOrFail(this.programRepository, person.programId);
    return { kind: 'create', email, person };
  }

  /** Escribe lo decidido en `prepare`, dentro de la transacción de quien llama. */
  async link(
    repositories: Pick<TransactionalRepositories, 'collaborators'>,
    userId: string,
    pending: PendingPerson,
  ): Promise<CollaboratorEntity> {
    const { person } = pending;
    const consent =
      person.dataConsent !== undefined ? consentFields(person.dataConsent) : {};

    if (pending.kind === 'link') {
      // La persona ya existía (importada o sin cuenta): se completa su identificación.
      const linked = await repositories.collaborators.update(
        pending.existing.id,
        { userId, ...identificationOf(person), ...consent },
      );
      // Se borró entre `prepare` y `link`: mejor un 404 que una cuenta sin persona.
      if (!linked) {
        throw new NotFoundException({ message: 'Persona no encontrada' });
      }
      return linked;
    }

    return repositories.collaborators.create({
      email: pending.email,
      userId,
      firstName: person.firstName,
      lastName: person.lastName,
      personType: person.personType,
      programId: person.programId,
      ...person.profile,
      ...identificationOf(person),
      ...consent,
      source: 'REGISTRO',
    });
  }
}

function identificationOf(person: PersonForAccount): PersonIdentification {
  return {
    documentType: person.documentType,
    documentNumber: person.documentNumber,
    phone: person.phone,
    nationality: person.nationality,
    alternateEmail: person.alternateEmail ?? null,
    institutionalCode: person.institutionalCode ?? null,
  };
}
