import { IsBoolean, IsOptional } from 'class-validator';

export class RequestAnalysisDto {
  /**
   * Analiza aunque el proyecto, el catálogo y el prompt no hayan cambiado desde el último
   * análisis (p. ej. para pedir otra propuesta). Por defecto no: se evita gastar una llamada.
   */
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
