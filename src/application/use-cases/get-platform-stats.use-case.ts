import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  ReportingRepository,
  StatsFilters,
} from '../../domain/repositories/reporting.repository.interface';
import { REPORTING_REPOSITORY } from '../../shared/interfaces/tokens';
import type { StatsQueryDto } from '../dto/stats-query.dto';

// Los días del filtro son días de Colombia (UTC-5, sin horario de verano).
const BOGOTA_OFFSET = '-05:00';
const DAY_MS = 86_400_000;

// El DTO ya garantiza que el día existe en el calendario (@IsCalendarDate).
const startOfDay = (day: string): Date =>
  new Date(`${day}T00:00:00${BOGOTA_OFFSET}`);

/** RF15 (HU-14): indicadores del dashboard del ADMIN, calculados en la base y filtrables. */
@Injectable()
export class GetPlatformStatsUseCase {
  constructor(
    @Inject(REPORTING_REPOSITORY)
    private readonly reportingRepository: ReportingRepository,
  ) {}

  execute(query: StatsQueryDto = {}) {
    return this.reportingRepository.getStats(toFilters(query), new Date());
  }
}

function toFilters(query: StatsQueryDto): StatsFilters {
  const from = query.from ? startOfDay(query.from) : null;
  const toStart = query.to ? startOfDay(query.to) : null;
  if (from && toStart && from > toStart) {
    throw new UnprocessableEntityException({
      message: 'La fecha inicial no puede ser posterior a la final',
    });
  }
  return {
    from: from ?? undefined,
    // `to` incluye todo el día: el límite es el inicio del día siguiente.
    to: toStart ? new Date(toStart.getTime() + DAY_MS) : undefined,
    projectTypeId: query.projectTypeId,
    categoryId: query.categoryId,
    programId: query.programId,
    personType: query.personType,
  };
}
