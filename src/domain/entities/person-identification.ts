// Identificación y contacto de una persona (alcance v2.1, A1–A4). Una sola definición de
// formato y de "válido" para la API, la importación Excel y el seed.

/** CC cédula de ciudadanía, TI tarjeta de identidad, CE cédula de extranjería,
 *  PPT permiso por protección temporal, PA pasaporte. */
export const DOCUMENT_TYPES = ['CC', 'TI', 'CE', 'PPT', 'PA'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  CC: 'Cédula de ciudadanía',
  TI: 'Tarjeta de identidad',
  CE: 'Cédula de extranjería',
  PPT: 'Permiso por protección temporal',
  PA: 'Pasaporte',
};

// Longitudes: coinciden con las columnas de `collaborators` (migración AddPersonIdentification).
export const DOCUMENT_NUMBER_MAX_LENGTH = 20;
export const PHONE_MAX_LENGTH = 20;
export const NATIONALITY_MAX_LENGTH = 60;
export const ALTERNATE_EMAIL_MAX_LENGTH = 254;
export const INSTITUTIONAL_CODE_MAX_LENGTH = 20;

/** Nacionalidades sugeridas en formularios y en la plantilla; se acepta cualquier otra. */
export const COMMON_NATIONALITIES = [
  'Colombiana',
  'Venezolana',
  'Ecuatoriana',
  'Peruana',
  'Otra',
] as const;

/** Documentos que solo llevan dígitos; el resto (PPT, PA) son alfanuméricos. */
const NUMERIC_DOCUMENTS = new Set<DocumentType>(['CC', 'TI', 'CE']);
const NUMERIC_DOCUMENT = /^\d{5,15}$/;
const ALPHANUMERIC_DOCUMENT = /^[A-Z0-9]{5,20}$/;
/** 7 a 15 dígitos, con `+` opcional al inicio (un celular colombiano tiene 10). */
const PHONE = /^\+?\d{7,15}$/;
const INSTITUTIONAL_CODE = /^[A-Za-z0-9-]{1,20}$/;

export function isDocumentType(value: unknown): value is DocumentType {
  return (
    typeof value === 'string' &&
    (DOCUMENT_TYPES as readonly string[]).includes(value)
  );
}

/** "1.090.123.456" y " 1090123456 " son el mismo documento: sin puntos, espacios ni guiones. */
export function normalizeDocumentNumber(value: string): string {
  return value.replace(/[\s.-]/g, '').toUpperCase();
}

/** Motivo por el que un número de documento ya normalizado no es válido para su tipo, o `null`. */
export function documentNumberError(
  type: DocumentType,
  documentNumber: string,
): string | null {
  if (!documentNumber) return 'El número de documento es obligatorio';
  if (NUMERIC_DOCUMENTS.has(type)) {
    return NUMERIC_DOCUMENT.test(documentNumber)
      ? null
      : `El número de ${DOCUMENT_TYPE_LABEL[type].toLowerCase()} debe tener solo dígitos (entre 5 y 15)`;
  }
  return ALPHANUMERIC_DOCUMENT.test(documentNumber)
    ? null
    : `El número de ${DOCUMENT_TYPE_LABEL[type].toLowerCase()} debe tener entre 5 y 20 letras o dígitos`;
}

/** Quita espacios, guiones, puntos y paréntesis: "(+57) 300-123 4567" → "+573001234567". */
export function normalizePhone(value: string): string {
  return value.replace(/[\s().-]/g, '');
}

export const PHONE_ERROR =
  'El teléfono debe tener entre 7 y 15 dígitos (puede empezar con +)';

export function isValidPhone(phone: string): boolean {
  return PHONE.test(phone);
}

export const INSTITUTIONAL_CODE_ERROR =
  'El código institucional admite hasta 20 letras, dígitos o guiones';

export function isValidInstitutionalCode(code: string): boolean {
  return INSTITUTIONAL_CODE.test(code);
}

export const ALTERNATE_EMAIL_SAME_ERROR =
  'El correo alterno debe ser distinto del correo principal';

/** El correo alterno existe para cuando se pierde el principal: no puede ser el mismo. */
export function isSameEmail(a: string | null | undefined, b: string): boolean {
  return Boolean(a) && a!.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Datos de identificación y contacto que se guardan en la persona. */
export interface PersonIdentification {
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  nationality: string;
  alternateEmail: string | null;
  institutionalCode: string | null;
}

/** Faltan documento o teléfono: se pide completar el perfil (personas anteriores a v2.1). */
export function isIdentificationComplete(person: {
  documentType: DocumentType | null;
  documentNumber: string | null;
  phone: string | null;
  nationality: string | null;
}): boolean {
  return Boolean(
    person.documentType &&
    person.documentNumber &&
    person.phone &&
    person.nationality,
  );
}
