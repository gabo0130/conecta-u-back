import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImportRunEntity } from '../../../domain/entities/import-run.entity';
import type {
  CreateImportRunDto,
  ImportRunRepository,
} from '../../../domain/repositories/import-run.repository.interface';
import type {
  Page,
  PageParams,
} from '../../../shared/pagination/pagination.util';
import { toSkip } from '../../../shared/pagination/pagination.util';
import { ImportRunOrmEntity } from './import-run.orm-entity';

@Injectable()
export class TypeOrmImportRunRepository implements ImportRunRepository {
  constructor(
    @InjectRepository(ImportRunOrmEntity)
    private readonly repository: Repository<ImportRunOrmEntity>,
  ) {}

  async create(data: CreateImportRunDto): Promise<ImportRunEntity> {
    const run = this.repository.create({
      fileName: data.fileName,
      importedByUserId: data.importedByUserId,
      createdCount: data.createdCount,
      rejectedCount: data.rejected.length,
      rejected: data.rejected,
      warnings: data.warnings,
    });
    return toImportRunEntity(await this.repository.save(run));
  }

  async findAll(params: PageParams): Promise<Page<ImportRunEntity>> {
    const [runs, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: toSkip(params.page, params.pageSize),
      take: params.pageSize,
    });
    return { items: runs.map(toImportRunEntity), total };
  }

  async findById(id: string): Promise<ImportRunEntity | null> {
    const run = await this.repository.findOne({ where: { id } });
    return run ? toImportRunEntity(run) : null;
  }
}

function toImportRunEntity(run: ImportRunOrmEntity): ImportRunEntity {
  return new ImportRunEntity(
    run.id,
    run.fileName,
    run.importedByUserId,
    run.createdCount,
    run.rejectedCount,
    run.rejected,
    run.warnings,
    run.createdAt,
  );
}
