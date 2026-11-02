import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { EXTENSION_BY_MIME } from '../../domain/entities/experience-certificate';
import type {
  CertificateFile,
  ExperienceCertificateRepository,
  SaveCertificateDto,
} from '../../domain/repositories/experience-certificate.repository.interface';
import type { FileStorage } from '../../domain/repositories/file-storage.interface';
import { AppLoggerService } from '../../shared/logging/logger.service';
import {
  EXPERIENCE_CERTIFICATE_REPOSITORY,
  FILE_STORAGE,
} from '../../shared/interfaces/tokens';
import type { ValidatedCertificate } from './experience-certificate-file';

type Logger = ReturnType<AppLoggerService['forContext']>;

/**
 * Coordina el bucket (archivo) y la base (metadatos) de los certificados (RT16). El archivo se
 * sube antes de escribir en la base; si la escritura falla, se borra para no dejar huérfanos.
 */
@Injectable()
export class CertificateFiles {
  private readonly logger: Logger;

  constructor(
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    @Inject(EXPERIENCE_CERTIFICATE_REPOSITORY)
    private readonly repository: ExperienceCertificateRepository,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(CertificateFiles.name);
  }

  /**
   * Sube `certificate` y ejecuta `write` con lo que debe quedar en la base. Si `write` lanza,
   * el objeto subido se borra y el error se propaga.
   */
  async withUploaded<T>(
    collaboratorId: string,
    certificate: ValidatedCertificate,
    write: (saved: SaveCertificateDto) => Promise<T>,
  ): Promise<T> {
    const saved = await this.upload(collaboratorId, certificate);
    try {
      return await write(saved);
    } catch (error) {
      await this.discard(saved.storageKey);
      throw error;
    }
  }

  /** Lee el archivo del bucket (o de la base, si es anterior al bucket). */
  async read(experienceId: string): Promise<CertificateFile | null> {
    const stored = await this.repository.find(experienceId);
    if (!stored) return null;
    const content = stored.storageKey
      ? await this.storage.get(stored.storageKey)
      : await this.repository.findLegacyContent(experienceId);
    if (!content) {
      this.logger.error('El certificado no tiene archivo', undefined, {
        method: 'read',
        experienceId,
      });
      return null;
    }
    const { fileName, mimeType, sizeBytes, uploadedAt } = stored;
    return { fileName, mimeType, sizeBytes, uploadedAt, content };
  }

  /** Clave del objeto de una experiencia, para borrarlo después de borrar la fila. */
  async keyOf(experienceId: string): Promise<string | null> {
    return (await this.repository.find(experienceId))?.storageKey ?? null;
  }

  /** Borra un objeto que ya no se usa; si falla solo se registra (no afecta al usuario). */
  async discard(storageKey: string | null | undefined): Promise<void> {
    if (!storageKey) return;
    try {
      await this.storage.delete(storageKey);
    } catch (error) {
      this.logger.error('No se pudo borrar el certificado del bucket', error, {
        method: 'discard',
        storageKey,
      });
    }
  }

  private async upload(
    collaboratorId: string,
    certificate: ValidatedCertificate,
  ): Promise<SaveCertificateDto> {
    const storageKey = `certificates/${collaboratorId}/${randomUUID()}.${EXTENSION_BY_MIME[certificate.mimeType]}`;
    await this.storage.put(
      storageKey,
      certificate.content,
      certificate.mimeType,
    );
    return {
      fileName: certificate.fileName,
      mimeType: certificate.mimeType,
      sizeBytes: certificate.content.length,
      storageKey,
    };
  }
}
