import type {
  CertificateMimeType,
  ExperienceCertificateInfo,
} from '../entities/experience-certificate';

/** Certificado listo para descargar. */
export interface CertificateFile extends ExperienceCertificateInfo {
  content: Buffer;
}

/** Metadatos guardados en la base; el archivo vive en el almacenamiento (`FileStorage`). */
export interface StoredCertificate extends ExperienceCertificateInfo {
  /** `null` solo en certificados anteriores al bucket, que aún tienen el contenido en la base. */
  storageKey: string | null;
}

export interface SaveCertificateDto {
  fileName: string;
  mimeType: CertificateMimeType;
  sizeBytes: number;
  storageKey: string;
}

/** Un certificado por experiencia: guardar otro lo reemplaza. */
export interface ExperienceCertificateRepository {
  save(
    experienceId: string,
    data: SaveCertificateDto,
  ): Promise<ExperienceCertificateInfo>;
  find(experienceId: string): Promise<StoredCertificate | null>;
  /** Contenido de un certificado anterior al bucket (`storageKey` nulo). */
  findLegacyContent(experienceId: string): Promise<Buffer | null>;
  delete(experienceId: string): Promise<boolean>;
}
