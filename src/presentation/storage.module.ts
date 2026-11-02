import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CertificateFiles } from '../application/support/certificate-files';
import { createFileStorage } from '../infrastructure/storage/create-file-storage';
import { FILE_STORAGE } from '../shared/interfaces/tokens';
import { PersistenceModule } from './persistence.module';

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
