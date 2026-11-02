import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetEvaluationSummaryUseCase } from '../../application/use-cases/get-evaluation-summary.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/** Tesis (D6): indicadores de evaluación del recomendador para el ADMIN. */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['ADMIN'] })
@Controller('admin/evaluation')
export class AdminEvaluationController {
  constructor(private readonly summaryUseCase: GetEvaluationSummaryUseCase) {}

  @Get()
  summary() {
    return this.summaryUseCase.execute();
  }
}
