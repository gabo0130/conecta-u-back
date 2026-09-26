import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ExperienceDto } from '../../application/dto/experience.dto';
import { CreateMyExperienceUseCase } from '../../application/use-cases/create-my-experience.use-case';
import { DeleteMyExperienceUseCase } from '../../application/use-cases/delete-my-experience.use-case';
import { UpdateMyExperienceUseCase } from '../../application/use-cases/update-my-experience.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

/** Experiencia del perfil con dedicación y nivel (RF5). */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['COLABORADOR', 'LIDER'] })
@Controller('collaborators/me/experience')
export class CollaboratorExperienceController {
  constructor(
    private readonly createMyExperienceUseCase: CreateMyExperienceUseCase,
    private readonly updateMyExperienceUseCase: UpdateMyExperienceUseCase,
    private readonly deleteMyExperienceUseCase: DeleteMyExperienceUseCase,
  ) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: ExperienceDto) {
    return this.createMyExperienceUseCase.execute(request.user!.userId, dto);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: ExperienceDto,
  ) {
    return this.updateMyExperienceUseCase.execute(
      request.user!.userId,
      id,
      dto,
    );
  }

  @HttpCode(204)
  @Delete(':id')
  delete(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
  ) {
    return this.deleteMyExperienceUseCase.execute(request.user!.userId, id);
  }
}
