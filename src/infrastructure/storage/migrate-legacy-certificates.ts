import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { IsNull } from 'typeorm';
import {
  EXTENSION_BY_MIME,
  type CertificateMimeType,
} from '../../domain/entities/experience-certificate';
import { createFileStorage } from '../../presentation/storage.module';
import { AppDataSource } from '../database/data-source';
import { ExperienceCertificateOrmEntity } from '../database/typeorm/experience-certificate.orm-entity';

/**
 * Mueve al bucket los certificados subidos antes de RT16 (contenido en la base). Idempotente:
 * solo toma filas sin `storageKey`. Uso: `npm run storage:migrate-certificates`, con las mismas
 * variables STORAGE_DRIVER y S3_* del backend.
 */
async function migrate(): Promise<void> {
  const storage = createFileStorage(new ConfigService(process.env));
  await AppDataSource.initialize();
  const repository = AppDataSource.getRepository(
    ExperienceCertificateOrmEntity,
  );
  const pending = await repository.find({
    where: { storageKey: IsNull() },
    relations: { experience: true },
  });
  let moved = 0;
  for (const row of pending) {
    const withContent = await repository
      .createQueryBuilder('certificate')
      .addSelect('certificate.content')
      .where('certificate.experienceId = :id', { id: row.experienceId })
      .getOne();
    if (!withContent?.content) continue;
    const owner = row.experience?.collaboratorId ?? 'sin-persona';
    const extension = EXTENSION_BY_MIME[row.mimeType as CertificateMimeType];
    const storageKey = `certificates/${owner}/${randomUUID()}.${extension}`;
    await storage.put(storageKey, withContent.content, row.mimeType);
    await repository.update(
      { experienceId: row.experienceId },
      { storageKey, content: null },
    );
    moved += 1;
  }
  console.log(
    `Certificados movidos al almacenamiento: ${moved}/${pending.length}`,
  );
  await AppDataSource.destroy();
}

migrate().catch((error: unknown) => {
  console.error('No se pudieron mover los certificados', error);
  process.exit(1);
});
