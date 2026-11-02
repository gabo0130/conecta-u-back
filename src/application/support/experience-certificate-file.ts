import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CERTIFICATE_MAX_SIZE_BYTES,
  CERTIFICATE_MAX_SIZE_MB,
  detectCertificateMimeType,
  sanitizeCertificateFileName,
} from '../../domain/entities/experience-certificate';
import type { CertificateMimeType } from '../../domain/entities/experience-certificate';

export interface UploadedCertificate {
  buffer: Buffer;
  originalName?: string;
}

/** Archivo ya validado (tamaño y tipo real), listo para subir al almacenamiento. */
export interface ValidatedCertificate {
  fileName: string;
  mimeType: CertificateMimeType;
  content: Buffer;
}

export const CERTIFICATE_REQUIRED_MESSAGE =
  'Debes adjuntar el certificado (PDF, PNG o JPG)';
export const CERTIFICATE_REQUIRED_FOR_TYPE_MESSAGE =
  'La experiencia laboral, de práctica o de docencia debe tener su certificado (PDF, PNG o JPG)';
export const CERTIFICATE_LOCKED_MESSAGE =
  'La experiencia laboral, de práctica o de docencia no puede quedar sin certificado: reemplázalo por otro en lugar de quitarlo';
export const CERTIFICATE_NOT_FOUND = 'Esta experiencia no tiene certificado';
export const EXPERIENCE_NOT_FOUND = 'Recurso no encontrado';

/** Valida tamaño y tipo real (firma del archivo) antes de escribir nada. */
export function validateCertificate(
  file: UploadedCertificate | undefined,
): ValidatedCertificate {
  if (!file || file.buffer.length === 0) {
    throw new BadRequestException({ message: CERTIFICATE_REQUIRED_MESSAGE });
  }
  if (file.buffer.length > CERTIFICATE_MAX_SIZE_BYTES) {
    throw new PayloadTooLargeException({
      message: `El certificado supera el tamaño máximo permitido (${CERTIFICATE_MAX_SIZE_MB} MB)`,
    });
  }
  const mimeType = detectCertificateMimeType(file.buffer);
  if (!mimeType) {
    throw new UnprocessableEntityException({
      message: 'El certificado debe ser un PDF o una imagen PNG o JPG',
    });
  }
  return {
    fileName: sanitizeCertificateFileName(file.originalName, mimeType),
    mimeType,
    content: file.buffer,
  };
}

export function certificateNotFound(): NotFoundException {
  return new NotFoundException({ message: CERTIFICATE_NOT_FOUND });
}
