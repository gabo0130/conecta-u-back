import { ConfigService } from '@nestjs/config';
import { LocalFileStorage } from '../infrastructure/storage/local-file-storage';
import { S3FileStorage } from '../infrastructure/storage/s3-file-storage';
import { createFileStorage } from './storage.module';

const config = (values: Record<string, string>) => new ConfigService(values);

describe('createFileStorage', () => {
  it('uses the local folder in development', () => {
    expect(createFileStorage(config({}))).toBeInstanceOf(LocalFileStorage);
  });

  it('uses the bucket when STORAGE_DRIVER=s3 is configured', () => {
    expect(
      createFileStorage(
        config({
          STORAGE_DRIVER: 's3',
          S3_BUCKET: 'certificados',
          S3_REGION: 'auto',
          S3_ENDPOINT: 'https://cuenta.r2.cloudflarestorage.com',
          S3_ACCESS_KEY_ID: 'id',
          S3_SECRET_ACCESS_KEY: 'secret',
        }),
      ),
    ).toBeInstanceOf(S3FileStorage);
  });

  it('names the missing bucket variables', () => {
    expect(() =>
      createFileStorage(config({ STORAGE_DRIVER: 's3', S3_BUCKET: 'b' })),
    ).toThrow('S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY');
  });

  it('refuses the local disk in production', () => {
    expect(() => createFileStorage(config({ NODE_ENV: 'production' }))).toThrow(
      'STORAGE_DRIVER=s3',
    );
  });
});
