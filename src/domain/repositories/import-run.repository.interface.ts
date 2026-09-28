import type { Page, PageParams } from '../../shared/pagination/pagination.util';
import type {
  ImportRejectedRow,
  ImportRunEntity,
} from '../entities/import-run.entity';

export interface CreateImportRunDto {
  fileName: string;
  importedByUserId: string | null;
  createdCount: number;
  rejected: ImportRejectedRow[];
  warnings: string[];
}

export interface ImportRunRepository {
  create(data: CreateImportRunDto): Promise<ImportRunEntity>;
  /** Historial de corridas, más reciente primero (vista del ADMIN). */
  findAll(params: PageParams): Promise<Page<ImportRunEntity>>;
  findById(id: string): Promise<ImportRunEntity | null>;
}
