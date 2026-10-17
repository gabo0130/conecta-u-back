import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  GenerateRecommendationsDto,
  ListRecommendationsQueryDto,
} from '../../application/dto/recommendations.dto';
import { GenerateRecommendationsUseCase } from '../../application/use-cases/generate-recommendations.use-case';
import { GetRecommendationDetailUseCase } from '../../application/use-cases/get-recommendation-detail.use-case';
import { ListRecommendationsUseCase } from '../../application/use-cases/list-recommendations.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

/** RF15–RF17: recomendaciones de personas para los perfiles requeridos de un proyecto. */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Controller('projects/:id/recommendations')
export class RecommendationsController {
  constructor(
    private readonly generateUseCase: GenerateRecommendationsUseCase,
    private readonly listUseCase: ListRecommendationsUseCase,
    private readonly detailUseCase: GetRecommendationDetailUseCase,
  ) {}

  @Post()
  @HttpCode(200)
  @Authorize({ anyOfRoles: ['LIDER'] })
  generate(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: GenerateRecommendationsDto,
  ) {
    return this.generateUseCase.execute(request.user!.userId, id, dto);
  }

  @Get()
  @Authorize({ anyOfRoles: ['LIDER', 'ADMIN'] })
  list(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Query() query: ListRecommendationsQueryDto,
  ) {
    const { userId, role } = request.user!;
    return this.listUseCase.execute({ userId, role }, id, query);
  }

  @Get(':recommendationId')
  @Authorize({ anyOfRoles: ['LIDER', 'ADMIN'] })
  detail(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Param('recommendationId', UuidParamPipe) recommendationId: string,
  ) {
    const { userId, role } = request.user!;
    return this.detailUseCase.execute({ userId, role }, id, recommendationId);
  }
}
