import type { ExperienceType } from './experience-type.type';

/**
 * v2.2, E8 (RF4): la experiencia laboral, de práctica y de docencia se soporta con un
 * certificado (PDF o imagen). El archivo se guarda con acceso restringido (RT16): solo la
 * propia persona y el ADMIN pueden descargarlo; nunca el líder ni las recomendaciones.
 */
export const CERTIFICATE_REQUIRED_TYPES: readonly ExperienceType[] = [
  'LABORAL',
  'PRACTICA',
  'DOCENCIA',
];

export const CERTIFICATE_MAX_SIZE_MB = 2;
export const CERTIFICATE_MAX_SIZE_BYTES = CERTIFICATE_MAX_SIZE_MB * 1024 * 1024;
export const CERTIFICATE_FILE_NAME_MAX_LENGTH = 160;

export const CERTIFICATE_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const;
export type CertificateMimeType = (typeof CERTIFICATE_MIME_TYPES)[number];

/** Metadatos del certificado (sin el contenido), para mostrar en el perfil. */
export interface ExperienceCertificateInfo {
  fileName: string;
  mimeType: CertificateMimeType;
  sizeBytes: number;
  uploadedAt: Date;
}

export function requiresCertificate(type: ExperienceType): boolean {
  return CERTIFICATE_REQUIRED_TYPES.includes(type);
}

/**
 * Tipo real del archivo por su firma (no por la extensión ni el Content-Type que manda el
 * navegador, que se pueden falsear). `null` si no es PDF, PNG ni JPEG.
 */
export function detectCertificateMimeType(
  content: Buffer,
): CertificateMimeType | null {
  if (
    content.length >= 5 &&
    content.subarray(0, 5).toString('latin1') === '%PDF-'
  ) {
    return 'application/pdf';
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (
    content.length >= png.length &&
    png.every((byte, i) => content[i] === byte)
  ) {
    return 'image/png';
  }
  if (
    content.length >= 3 &&
    content[0] === 0xff &&
    content[1] === 0xd8 &&
    content[2] === 0xff
  ) {
    return 'image/jpeg';
  }
  return null;
}

export const EXTENSION_BY_MIME: Record<CertificateMimeType, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

/**
 * Nombre seguro para guardar y para el `Content-Disposition`: sin rutas, sin caracteres de
 * control ni comillas, recortado, y con la extensión que corresponde al tipo real.
 */
export function sanitizeCertificateFileName(
  original: string | undefined,
  mimeType: CertificateMimeType,
): string {
  const extension = EXTENSION_BY_MIME[mimeType];
  const base = (original ?? '')
    .split(/[\\/]/)
    .pop()!
    .replace(/\.[^.]*$/, '')
    .normalize('NFC')
    // Caracteres de control (código < 32 o 127) y los que Windows no admite en nombres.
    .replace(/[\p{Cc}"<>|:*?]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const safeBase = (base || 'certificado').slice(
    0,
    CERTIFICATE_FILE_NAME_MAX_LENGTH - extension.length - 1,
  );
  return `${safeBase}.${extension}`;
}
