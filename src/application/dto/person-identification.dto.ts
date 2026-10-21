import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, MaxLength } from 'class-validator';
import {
  ALTERNATE_EMAIL_MAX_LENGTH,
  DOCUMENT_TYPES,
  type DocumentType,
  NATIONALITY_MAX_LENGTH,
} from '../../domain/entities/person-identification';
import {
  IsDocumentNumber,
  IsInstitutionalCode,
  IsPhone,
} from './validators/person-identification.decorators';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsOptionalText, IsRequiredText } from './validators/text.decorators';

const DOCUMENT_TYPE_MESSAGE = `documentType debe ser uno de: ${DOCUMENT_TYPES.join(', ')}`;

/** Correo opcional que se puede vaciar: `""` se guarda como `null`; se compara en minúsculas. */
const optionalEmail = () =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const email = value.trim().toLowerCase();
    return email === '' ? null : email;
  });

/**
 * Identificación y contacto obligatorios al crear una persona (v2.1, A1–A4): registro,
 * crear usuario (ADMIN) y crear el propio perfil. Los DTO que crean personas la heredan.
 */
export class PersonIdentificationDto {
  @IsIn(DOCUMENT_TYPES, { message: DOCUMENT_TYPE_MESSAGE })
  documentType: DocumentType;

  @IsDocumentNumber()
  documentNumber: string;

  @IsPhone()
  phone: string;

  @IsRequiredText({ max: NATIONALITY_MAX_LENGTH })
  nationality: string;

  @optionalEmail()
  @IsOptional()
  @IsEmail({}, { message: 'Formato de correo alterno inválido' })
  @MaxLength(ALTERNATE_EMAIL_MAX_LENGTH)
  alternateEmail?: string | null;

  @IsOptionalText()
  @IsOptional()
  @IsInstitutionalCode()
  institutionalCode?: string | null;
}

/** Lo que la propia persona puede corregir de su contacto (el documento solo lo cambia el ADMIN). */
export class UpdateContactDto {
  @IsOptionalNonNull()
  @IsPhone()
  phone?: string;

  @IsOptionalNonNull()
  @IsRequiredText({ max: NATIONALITY_MAX_LENGTH })
  nationality?: string;

  @optionalEmail()
  @IsOptional()
  @IsEmail({}, { message: 'Formato de correo alterno inválido' })
  @MaxLength(ALTERNATE_EMAIL_MAX_LENGTH)
  alternateEmail?: string | null;

  @IsOptionalText()
  @IsOptional()
  @IsInstitutionalCode()
  institutionalCode?: string | null;
}

/** Identificación y contacto parciales: el ADMIN para cualquier persona; la propia persona solo completa el documento si le falta. */
export class UpdateIdentificationDto extends UpdateContactDto {
  @IsOptionalNonNull()
  @IsIn(DOCUMENT_TYPES, { message: DOCUMENT_TYPE_MESSAGE })
  documentType?: DocumentType;

  @IsOptionalNonNull()
  @IsDocumentNumber()
  documentNumber?: string;
}
