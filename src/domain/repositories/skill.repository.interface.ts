import type { Page, PageParams } from '../../shared/pagination/pagination.util';
import type { SkillCategory } from '../entities/skill-category.type';
import type { SkillStatus } from '../entities/skill-status.type';
import type { SkillType } from '../entities/skill-type.type';
import { SkillEntity } from '../entities/skill.entity';

export interface CreateSkillRepositoryDto {
  name: string;
  normalizedName: string;
  type: SkillType;
  category?: SkillCategory;
  synonyms?: string[];
  status?: SkillStatus;
}

export interface UpdateSkillRepositoryDto {
  name?: string;
  normalizedName?: string;
  type?: SkillType;
  category?: SkillCategory;
  synonyms?: string[];
  status?: SkillStatus;
}

export interface SkillSearchFilter {
  /** Texto ya normalizado con `normalizeSkillName`. */
  normalizedQuery?: string;
  type?: SkillType;
}

export interface SkillAdminFilter {
  /** Texto ya normalizado con `normalizeSkillName`. */
  normalizedQuery?: string;
  type?: SkillType;
  category?: SkillCategory;
  status?: SkillStatus;
}

export interface SkillRepository {
  findById(id: string): Promise<SkillEntity | null>;
  findByIds(ids: string[]): Promise<SkillEntity[]>;
  findByNormalizedNameOrSynonym(
    normalized: string,
  ): Promise<SkillEntity | null>;
  /** Autocompletar (capado, sin paginar): lo usa el `SkillPicker`. */
  search(filter: SkillSearchFilter): Promise<SkillEntity[]>;
  /** Listado paginado con filtros, para la pantalla de administración (RF22). */
  findAllPaged(
    params: PageParams,
    filter?: SkillAdminFilter,
  ): Promise<Page<SkillEntity>>;
  create(data: CreateSkillRepositoryDto): Promise<SkillEntity>;
  update(
    id: string,
    data: UpdateSkillRepositoryDto,
  ): Promise<SkillEntity | null>;
}
