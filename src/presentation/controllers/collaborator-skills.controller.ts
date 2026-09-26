import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CollaboratorSkillDto } from '../../application/dto/collaborator-skill.dto';
import { AddMyCollaboratorSkillUseCase } from '../../application/use-cases/add-my-collaborator-skill.use-case';
import { DeleteMyCollaboratorSkillUseCase } from '../../application/use-cases/delete-my-collaborator-skill.use-case';
import { ListMyCollaboratorSkillsUseCase } from '../../application/use-cases/list-my-collaborator-skills.use-case';
import { UpdateMyCollaboratorSkillUseCase } from '../../application/use-cases/update-my-collaborator-skill.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

/** Conocimientos, competencias y habilidades blandas del perfil (RF4). */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['COLABORADOR', 'LIDER'] })
@Controller('collaborators/me/skills')
export class CollaboratorSkillsController {
  constructor(
    private readonly listMyCollaboratorSkillsUseCase: ListMyCollaboratorSkillsUseCase,
    private readonly addMyCollaboratorSkillUseCase: AddMyCollaboratorSkillUseCase,
    private readonly updateMyCollaboratorSkillUseCase: UpdateMyCollaboratorSkillUseCase,
    private readonly deleteMyCollaboratorSkillUseCase: DeleteMyCollaboratorSkillUseCase,
  ) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.listMyCollaboratorSkillsUseCase.execute(request.user!.userId);
  }

  @Post()
  add(@Req() request: AuthenticatedRequest, @Body() dto: CollaboratorSkillDto) {
    return this.addMyCollaboratorSkillUseCase.execute(
      request.user!.userId,
      dto,
    );
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: CollaboratorSkillDto,
  ) {
    return this.updateMyCollaboratorSkillUseCase.execute(
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
    return this.deleteMyCollaboratorSkillUseCase.execute(
      request.user!.userId,
      id,
    );
  }
}
