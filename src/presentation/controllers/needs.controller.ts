import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CreateNeedDto,
  DiscardNeedDto,
  ListNeedsQueryDto,
  UpdateNeedDto,
} from '../../application/dto/needs.dto';
import { CharacterizeNeedUseCase } from '../../application/use-cases/characterize-need.use-case';
import { CreateNeedUseCase } from '../../application/use-cases/create-need.use-case';
import { DiscardNeedUseCase } from '../../application/use-cases/discard-need.use-case';
import { GetNeedUseCase } from '../../application/use-cases/get-need.use-case';
import { ListNeedsUseCase } from '../../application/use-cases/list-needs.use-case';
import { UpdateNeedUseCase } from '../../application/use-cases/update-need.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

/** Tesis (D1): necesidades institucionales. Las registra el formulador (LIDER); el ADMIN las consulta. */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['LIDER'] })
@Controller('needs')
export class NeedsController {
  constructor(
    private readonly createUseCase: CreateNeedUseCase,
    private readonly listUseCase: ListNeedsUseCase,
    private readonly getUseCase: GetNeedUseCase,
    private readonly updateUseCase: UpdateNeedUseCase,
    private readonly discardUseCase: DiscardNeedUseCase,
    private readonly characterizeUseCase: CharacterizeNeedUseCase,
  ) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateNeedDto) {
    return this.createUseCase.execute(request.user!.userId, dto);
  }

  @Get()
  @Authorize({ anyOfRoles: ['LIDER', 'ADMIN'] })
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListNeedsQueryDto,
  ) {
    const { userId, role } = request.user!;
    return this.listUseCase.execute({ userId, role }, query);
  }

  @Get(':id')
  @Authorize({ anyOfRoles: ['LIDER', 'ADMIN'] })
  getById(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
  ) {
    const { userId, role } = request.user!;
    return this.getUseCase.execute({ userId, role }, id);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: UpdateNeedDto,
  ) {
    return this.updateUseCase.execute(request.user!.userId, id, dto);
  }

  /** T2: caracterización con IA (503 si el servicio no responde). */
  @Post(':id/characterization')
  @HttpCode(200)
  characterize(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
  ) {
    return this.characterizeUseCase.execute(request.user!.userId, id);
  }

  @Post(':id/discard')
  @HttpCode(200)
  discard(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: DiscardNeedDto,
  ) {
    return this.discardUseCase.execute(request.user!.userId, id, dto);
  }
}
