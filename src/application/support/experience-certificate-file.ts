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
import type { SaveCertificateDto } from '../../domain/repositories/experience-certificate.repository.interface';

export interface UploadedCertificate {
  buffer: Buffer;
  originalName?: string;
}

export const CERTIFICATE_REQUIRED_MESSAGE =
  'Debes adjuntar el certificado (PDF, PNG o JPG)';
export const CERTIFICATE_NOT_FOUND = 'Esta experiencia no tiene certificado';
export const EXPERIENCE_NOT_FOUND = 'Recurso no encontrado';

/** Valida tamaño y tipo real (firma del archivo) y arma lo que se guarda. */
export function toCertificateToSave(
  file: UploadedCertificate | undefined,
): SaveCertificateDto {
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
