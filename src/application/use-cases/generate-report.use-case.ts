import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ReportingRepository } from '../../domain/repositories/reporting.repository.interface';
import type {
  ReportFormat,
  ReportWriter,
} from '../../domain/repositories/report-writer.interface';
import {
  REPORT_WRITER,
  REPORTING_REPOSITORY,
} from '../../shared/interfaces/tokens';
import {
  REPORT_KINDS,
  REPORTS,
  type ReportKind,
} from '../reports/report-definitions';

export interface GeneratedReport {
  fileName: string;
  contentType: string;
  content: Buffer;
}

const CONTENT_TYPE: Record<ReportFormat, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv; charset=utf-8',
};

function isReportKind(value: string): value is ReportKind {
  return (REPORT_KINDS as readonly string[]).includes(value);
}

/** RF16: reportes consolidados del ADMIN en Excel o CSV. */
@Injectable()
export class GenerateReportUseCase {
  constructor(
    @Inject(REPORTING_REPOSITORY)
    private readonly reportingRepository: ReportingRepository,
    @Inject(REPORT_WRITER) private readonly reportWriter: ReportWriter,
  ) {}

  async execute(
    kind: string,
    format: ReportFormat = 'xlsx',
    now = new Date(),
  ): Promise<GeneratedReport> {
    if (!isReportKind(kind)) {
      throw new NotFoundException({
        message: `Reporte no encontrado. Disponibles: ${REPORT_KINDS.join(', ')}`,
      });
    }
    const definition = REPORTS[kind];
    const rows = await definition.load(this.reportingRepository);
    const stamp = now.toISOString().slice(0, 10);
    const content = await this.reportWriter.write(
      {
        title: definition.title,
        subtitle: `Conecta U · generado el ${stamp} · ${rows.length} registros`,
        columns: definition.columns,
        rows,
      },
      format,
    );
    return {
      fileName: `${definition.fileName}-${stamp}.${format}`,
      contentType: CONTENT_TYPE[format],
      content,
    };
  }
}
