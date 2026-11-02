import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { FileStorage } from '../../domain/repositories/file-storage.interface';

export interface S3StorageConfig {
  bucket: string;
  region: string;
  /** Solo para proveedores compatibles con S3 (Cloudflare R2, Supabase Storage, MinIO). */
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** MinIO y algunos proveedores exigen `bucket` en la ruta y no en el subdominio. */
  forcePathStyle?: boolean;
}

/** Adaptador S3 del puerto `FileStorage`: el bucket es privado y no se generan URLs públicas. */
export class S3FileStorage implements FileStorage {
  private readonly client: S3Client;

  constructor(
    private readonly config: S3StorageConfig,
    // Se puede inyectar para probar sin red.
    client?: S3Client,
  ) {
    this.client =
      client ??
      new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        forcePathStyle: config.forcePathStyle,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
  }

  async put(key: string, content: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: content,
        ContentType: contentType,
        ContentLength: content.length,
      }),
    );
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
      );
      if (!result.Body) return null;
      return Buffer.from(await result.Body.transformToByteArray());
    } catch (error) {
      if (error instanceof NoSuchKey) return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
    );
  }
}
