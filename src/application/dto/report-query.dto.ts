import { IsIn, IsOptional } from 'class-validator';
import {
  REPORT_FORMATS,
  type ReportFormat,
} from '../../domain/repositories/report-writer.interface';

export class ReportQueryDto {
  @IsOptional()
  @IsIn(REPORT_FORMATS, { message: 'format debe ser xlsx o csv' })
  format?: ReportFormat;
}
