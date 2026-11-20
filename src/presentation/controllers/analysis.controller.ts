import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../application/dto/pagination-query.dto';
import { RequestAnalysisDto } from '../../application/dto/request-analysis.dto';
import { GetProjectAnalysisUseCase } from '../../application/use-cases/get-project-analysis.use-case';
import { ListProjectAnalysesUseCase } from '../../application/use-cases/list-project-analyses.use-case';
import { RequestProjectAnalysisUseCase } from '../../application/use-cases/request-project-analysis.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

/**
 * RF6: análisis de un proyecto con IA. Lo piden y lo ven su líder dueño y el ADMIN (que también
 * registra proyectos a nombre de un líder).
 */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Controller('projects/:id')
export class AnalysisController {
  constructor(
    private readonly requestAnalysisUseCase: RequestProjectAnalysisUseCase,
    private readonly getAnalysisUseCase: GetProjectAnalysisUseCase,
    private readonly listAnalysesUseCase: ListProjectAnalysesUseCase,
  ) {}

  /** 202: el análisis queda PENDIENTE y corre en segundo plano; se consulta con `analyses/:analysisId`. */
  @Post('analysis')
  @HttpCode(HttpStatus.ACCEPTED)
  @Authorize({ anyOfRoles: ['LIDER', 'ADMIN'] })
  request(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: RequestAnalysisDto,
  ) {
    const { userId, role } = request.user!;
    return this.requestAnalysisUseCase.execute({ userId, role }, id, dto);
  }

  @Get('analysis')
  @Authorize({ anyOfRoles: ['LIDER', 'ADMIN'] })
  getLatest(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
  ) {
    const { userId, role } = request.user!;
    return this.getAnalysisUseCase.execute({ userId, role }, id);
  }

  @Get('analyses/:analysisId')
  @Authorize({ anyOfRoles: ['LIDER', 'ADMIN'] })
  getAttempt(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Param('analysisId', UuidParamPipe) analysisId: string,
  ) {
    const { userId, role } = request.user!;
    return this.getAnalysisUseCase.execute({ userId, role }, id, analysisId);
  }

  @Get('analyses')
  @Authorize({ anyOfRoles: ['LIDER', 'ADMIN'] })
  list(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { userId, role } = request.user!;
    return this.listAnalysesUseCase.execute({ userId, role }, id, query);
  }
}
