import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  CertificateMimeType,
  ExperienceCertificateInfo,
} from '../../../domain/entities/experience-certificate';
import type {
  ExperienceCertificateRepository,
  SaveCertificateDto,
  StoredCertificate,
} from '../../../domain/repositories/experience-certificate.repository.interface';
import { ExperienceCertificateOrmEntity } from './experience-certificate.orm-entity';

function toStored(row: ExperienceCertificateOrmEntity): StoredCertificate {
  return {
    fileName: row.fileName,
    mimeType: row.mimeType as CertificateMimeType,
    sizeBytes: row.sizeBytes,
    uploadedAt: row.uploadedAt,
    storageKey: row.storageKey,
  };
}

@Injectable()
export class TypeOrmExperienceCertificateRepository implements ExperienceCertificateRepository {
  constructor(
    @InjectRepository(ExperienceCertificateOrmEntity)
    private readonly repository: Repository<ExperienceCertificateOrmEntity>,
  ) {}

  async save(
    experienceId: string,
    data: SaveCertificateDto,
  ): Promise<ExperienceCertificateInfo> {
    await this.repository.upsert(
      {
        experienceId,
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageKey: data.storageKey,
        content: null,
        uploadedAt: new Date(),
      },
      ['experienceId'],
    );
    const { fileName, mimeType, sizeBytes, uploadedAt } = toStored(
      await this.repository.findOneByOrFail({ experienceId }),
    );
    return { fileName, mimeType, sizeBytes, uploadedAt };
  }

  async find(experienceId: string): Promise<StoredCertificate | null> {
    const row = await this.repository.findOneBy({ experienceId });
    return row ? toStored(row) : null;
  }

  async findLegacyContent(experienceId: string): Promise<Buffer | null> {
    const row = await this.repository
      .createQueryBuilder('certificate')
      .addSelect('certificate.content')
      .where('certificate.experienceId = :experienceId', { experienceId })
      .getOne();
    return row?.content ?? null;
  }

  async delete(experienceId: string): Promise<boolean> {
    const result = await this.repository.delete({ experienceId });
    return (result.affected ?? 0) > 0;
  }
}
