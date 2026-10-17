import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../application/dto/pagination-query.dto';
import { GetProjectAnalysisUseCase } from '../../application/use-cases/get-project-analysis.use-case';
import { ListProjectAnalysesUseCase } from '../../application/use-cases/list-project-analyses.use-case';
import { RequestProjectAnalysisUseCase } from '../../application/use-cases/request-project-analysis.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

/** RF12–RF14: análisis de un proyecto con IA. Pedirlo es del líder dueño; verlo, también del ADMIN. */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Controller('projects/:id')
export class AnalysisController {
  constructor(
    private readonly requestAnalysisUseCase: RequestProjectAnalysisUseCase,
    private readonly getAnalysisUseCase: GetProjectAnalysisUseCase,
    private readonly listAnalysesUseCase: ListProjectAnalysesUseCase,
  ) {}

  @Post('analysis')
  @Authorize({ anyOfRoles: ['LIDER'] })
  request(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
  ) {
    return this.requestAnalysisUseCase.execute(request.user!.userId, id);
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
