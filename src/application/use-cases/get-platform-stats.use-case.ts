import { Inject, Injectable } from '@nestjs/common';
import type { ReportingRepository } from '../../domain/repositories/reporting.repository.interface';
import { REPORTING_REPOSITORY } from '../../shared/interfaces/tokens';

/** RF15 (HU-14): indicadores del dashboard del ADMIN, calculados en la base. */
@Injectable()
export class GetPlatformStatsUseCase {
  constructor(
    @Inject(REPORTING_REPOSITORY)
    private readonly reportingRepository: ReportingRepository,
  ) {}

  execute() {
    return this.reportingRepository.getStats(new Date());
  }
}
