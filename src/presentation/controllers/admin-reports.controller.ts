import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportQueryDto } from '../../application/dto/report-query.dto';
import { GenerateReportUseCase } from '../../application/use-cases/generate-report.use-case';
import { GetPlatformStatsUseCase } from '../../application/use-cases/get-platform-stats.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/** RF15–RF16 (HU-14): estadísticas del dashboard y reportes consolidados del ADMIN. */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['ADMIN'] })
@Controller('admin')
export class AdminReportsController {
  constructor(
    private readonly statsUseCase: GetPlatformStatsUseCase,
    private readonly reportUseCase: GenerateReportUseCase,
  ) {}

  @Get('stats')
  stats() {
    return this.statsUseCase.execute();
  }

  /** `kind`: proyectos, personas, habilidades, recomendaciones o convocatorias. */
  @Get('reports/:kind')
  async report(
    @Param('kind') kind: string,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const report = await this.reportUseCase.execute(kind, query.format);
    res.set({
      'Content-Type': report.contentType,
      'Content-Disposition': `attachment; filename="${report.fileName}"`,
      'Cache-Control': 'private, no-store',
    });
    res.send(report.content);
  }
}
