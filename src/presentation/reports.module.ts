import { Module } from '@nestjs/common';
import { GenerateReportUseCase } from '../application/use-cases/generate-report.use-case';
import { GetPlatformStatsUseCase } from '../application/use-cases/get-platform-stats.use-case';
import { ExcelJsReportWriter } from '../infrastructure/excel/exceljs-report-writer';
import { TypeOrmReportingRepository } from '../infrastructure/database/typeorm/typeorm-reporting.repository';
import {
  REPORT_WRITER,
  REPORTING_REPOSITORY,
} from '../shared/interfaces/tokens';
import { AdminReportsController } from './controllers/admin-reports.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

/** Dashboard y reportes del ADMIN (RF15–RF16). Consultas de solo lectura. */
@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [AdminReportsController],
  providers: [
    { provide: REPORTING_REPOSITORY, useClass: TypeOrmReportingRepository },
    { provide: REPORT_WRITER, useClass: ExcelJsReportWriter },
    GetPlatformStatsUseCase,
    GenerateReportUseCase,
  ],
})
export class ReportsModule {}
