import type {
  CertificateMimeType,
  ExperienceCertificateInfo,
} from '../entities/experience-certificate';

export interface CertificateFile extends ExperienceCertificateInfo {
  content: Buffer;
}

export interface SaveCertificateDto {
  fileName: string;
  mimeType: CertificateMimeType;
  content: Buffer;
}

/** Un certificado por experiencia: subir otro lo reemplaza. */
export interface ExperienceCertificateRepository {
  save(
    experienceId: string,
    data: SaveCertificateDto,
  ): Promise<ExperienceCertificateInfo>;
  findFile(experienceId: string): Promise<CertificateFile | null>;
  delete(experienceId: string): Promise<boolean>;
}
