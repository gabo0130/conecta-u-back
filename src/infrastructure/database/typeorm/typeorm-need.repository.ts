import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { FindOptionsOrder, FindOptionsWhere } from 'typeorm';
import { In, IsNull, Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {
  OPEN_NEED_STATUSES,
  type NeedCharacterization,
  NeedEntity,
  NeedKind,
  NeedStatus,
} from '../../../domain/entities/need';
import type {
  NeedChanges,
  NeedFilters,
  NeedRepository,
  NeedSort,
  NewNeed,
} from '../../../domain/repositories/need.repository.interface';
import type {
  Page,
  PageParams,
} from '../../../shared/pagination/pagination.util';
import { toSkip } from '../../../shared/pagination/pagination.util';
import { NeedOrmEntity } from './need.orm-entity';

const ORDER: Record<NeedSort, FindOptionsOrder<NeedOrmEntity>> = {
  recent: { createdAt: 'DESC' },
  priority: { priorityScore: 'DESC', createdAt: 'DESC' },
};

export function toNeedEntity(row: NeedOrmEntity): NeedEntity {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    kind: row.kind as NeedKind,
    status: row.status as NeedStatus,
    urgency: row.urgency,
    impact: row.impact,
    deadline: row.deadline,
    dependency: row.dependency,
    characterization:
      row.characterization as unknown as NeedCharacterization | null,
    characterizedAt: row.characterizedAt,
    completeness: row.completeness,
    priorityScore: row.priorityScore,
    projectId: row.projectId,
    discardReason: row.discardReason,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class TypeOrmNeedRepository implements NeedRepository {
  constructor(
    @InjectRepository(NeedOrmEntity)
    private readonly repository: Repository<NeedOrmEntity>,
  ) {}

  async create(data: NewNeed): Promise<NeedEntity> {
    const saved = await this.repository.save(this.repository.create(data));
    return toNeedEntity(saved);
  }

  async findById(id: string): Promise<NeedEntity | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? toNeedEntity(row) : null;
  }

  async findPage(
    { createdById, status, kind, sort }: NeedFilters,
    params: PageParams,
  ): Promise<Page<NeedEntity>> {
    const where: FindOptionsWhere<NeedOrmEntity> = {};
    if (createdById) where.createdById = createdById;
    if (status) where.status = status;
    if (kind) where.kind = kind;
    const [rows, total] = await this.repository.findAndCount({
      where,
      order: ORDER[sort],
      skip: toSkip(params.page, params.pageSize),
      take: params.pageSize,
    });
    return { items: rows.map(toNeedEntity), total };
  }

  updateIfOpen(id: string, changes: NeedChanges): Promise<NeedEntity | null> {
    return this.writeIfOpen({ id }, changes);
  }

  markConverted(id: string, projectId: string): Promise<NeedEntity | null> {
    return this.writeIfOpen(
      { id, projectId: IsNull() },
      { status: 'CONVERTIDA', projectId },
    );
  }

  /** UPDATE … WHERE status IN (abiertos): la condición y la escritura van juntas. */
  private async writeIfOpen(
    where: FindOptionsWhere<NeedOrmEntity>,
    changes: NeedChanges,
  ): Promise<NeedEntity | null> {
    const result = await this.repository.update(
      { ...where, status: In([...OPEN_NEED_STATUSES]) },
      // La caracterización es un objeto plano: se guarda tal cual en la columna jsonb.
      changes as QueryDeepPartialEntity<NeedOrmEntity>,
    );
    return result.affected === 1 ? this.findById(where.id as string) : null;
  }
}
