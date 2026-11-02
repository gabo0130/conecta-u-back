import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  CertificateMimeType,
  ExperienceCertificateInfo,
} from '../../../domain/entities/experience-certificate';
import type {
  CertificateFile,
  ExperienceCertificateRepository,
  SaveCertificateDto,
} from '../../../domain/repositories/experience-certificate.repository.interface';
import { ExperienceCertificateOrmEntity } from './experience-certificate.orm-entity';

function toInfo(
  row: ExperienceCertificateOrmEntity,
): ExperienceCertificateInfo {
  return {
    fileName: row.fileName,
    mimeType: row.mimeType as CertificateMimeType,
    sizeBytes: row.sizeBytes,
    uploadedAt: row.uploadedAt,
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
        sizeBytes: data.content.length,
        content: data.content,
        uploadedAt: new Date(),
      },
      ['experienceId'],
    );
    const saved = await this.repository.findOneByOrFail({ experienceId });
    return toInfo(saved);
  }

  async findFile(experienceId: string): Promise<CertificateFile | null> {
    const row = await this.repository
      .createQueryBuilder('certificate')
      .addSelect('certificate.content')
      .where('certificate.experienceId = :experienceId', { experienceId })
      .getOne();
    if (!row || !row.content) return null;
    return { ...toInfo(row), content: row.content };
  }

  async delete(experienceId: string): Promise<boolean> {
    const result = await this.repository.delete({ experienceId });
    return (result.affected ?? 0) > 0;
  }
}
