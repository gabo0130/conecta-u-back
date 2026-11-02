import type { Page, PageParams } from '../../shared/pagination/pagination.util';
import type { NeedEntity, NeedKind, NeedStatus } from '../entities/need';

export type NewNeed = Pick<
  NeedEntity,
  | 'title'
  | 'description'
  | 'kind'
  | 'urgency'
  | 'impact'
  | 'deadline'
  | 'dependency'
  | 'completeness'
  | 'priorityScore'
  | 'createdById'
>;

export type NeedChanges = Partial<
  Omit<NeedEntity, 'id' | 'createdById' | 'createdAt' | 'updatedAt'>
>;

/** `priority`: mayor puntaje de prioridad primero (T4); `recent`: más recientes primero. */
export const NEED_SORTS = ['recent', 'priority'] as const;
export type NeedSort = (typeof NEED_SORTS)[number];

export interface NeedFilters {
  /** Solo las del formulador; sin él, todas (vista del ADMIN). */
  createdById?: string;
  status?: NeedStatus;
  kind?: NeedKind;
  sort: NeedSort;
}

export interface NeedRepository {
  create(data: NewNeed): Promise<NeedEntity>;
  findById(id: string): Promise<NeedEntity | null>;
  findPage(filters: NeedFilters, params: PageParams): Promise<Page<NeedEntity>>;
  /**
   * Escribe solo si la necesidad sigue abierta (REGISTRADA o CARACTERIZADA), en la misma
   * sentencia: devuelve null si otra petición la convirtió o descartó entre la lectura y aquí.
   */
  updateIfOpen(id: string, changes: NeedChanges): Promise<NeedEntity | null>;
  /**
   * Enlaza la oportunidad y pasa la necesidad a CONVERTIDA solo si sigue abierta y sin
   * proyecto (escritura condicional). Devuelve la necesidad actualizada, o null si otra
   * petición se adelantó (ya convertida o descartada).
   */
  markConverted(id: string, projectId: string): Promise<NeedEntity | null>;
}
