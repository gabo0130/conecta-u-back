import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CertificateFiles } from '../application/support/certificate-files';
import type { FileStorage } from '../domain/repositories/file-storage.interface';
import { LocalFileStorage } from '../infrastructure/storage/local-file-storage';
import { S3FileStorage } from '../infrastructure/storage/s3-file-storage';
import { FILE_STORAGE } from '../shared/interfaces/tokens';
import { PersistenceModule } from './persistence.module';

const DEFAULT_LOCAL_DIR = './storage';
const S3_REQUIRED = [
  'S3_BUCKET',
  'S3_REGION',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const;

/**
 * Elige dónde se guardan los certificados (RT16). `STORAGE_DRIVER=s3` usa un bucket privado
 * (AWS S3, Cloudflare R2, Supabase Storage o MinIO); `local` guarda en disco y solo sirve en
 * desarrollo. En producción se exige el bucket: el disco de Render se borra en cada despliegue.
 */
export function createFileStorage(config: ConfigService): FileStorage {
  const driver = config.get<string>('STORAGE_DRIVER') ?? 'local';
  if (driver === 's3') {
    const missing = S3_REQUIRED.filter((name) => !config.get<string>(name));
    if (missing.length > 0) {
      throw new Error(
        `STORAGE_DRIVER=s3 requiere las variables: ${missing.join(', ')}`,
      );
    }
    return new S3FileStorage({
      bucket: config.get<string>('S3_BUCKET')!,
      region: config.get<string>('S3_REGION')!,
      endpoint: config.get<string>('S3_ENDPOINT') || undefined,
      accessKeyId: config.get<string>('S3_ACCESS_KEY_ID')!,
      secretAccessKey: config.get<string>('S3_SECRET_ACCESS_KEY')!,
      forcePathStyle: config.get<string>('S3_FORCE_PATH_STYLE') === 'true',
    });
  }
  if (driver !== 'local') {
    throw new Error(`STORAGE_DRIVER no válido: ${driver} (usa s3 o local)`);
  }
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error(
      'En producción los certificados se guardan en un bucket: define STORAGE_DRIVER=s3 y las variables S3_*',
    );
  }
  return new LocalFileStorage(
    config.get<string>('STORAGE_LOCAL_DIR') ?? DEFAULT_LOCAL_DIR,
  );
}

@Module({
  imports: [PersistenceModule],
  providers: [
    {
      provide: FILE_STORAGE,
      inject: [ConfigService],
      useFactory: createFileStorage,
    },
    CertificateFiles,
  ],
  exports: [FILE_STORAGE, CertificateFiles],
})
export class StorageModule {}
