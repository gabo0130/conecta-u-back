import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminGetCollaboratorUseCase } from '../../application/use-cases/admin-get-collaborator.use-case';
import { AdminGetProjectUseCase } from '../../application/use-cases/admin-get-project.use-case';
import { AdminListCollaboratorsUseCase } from '../../application/use-cases/admin-list-collaborators.use-case';
import { AdminListProjectsUseCase } from '../../application/use-cases/admin-list-projects.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

/** Consulta global del ADMIN: todos los proyectos y todos los perfiles técnicos (HU-15/HU-16, lectura). */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['ADMIN'] })
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminListProjectsUseCase: AdminListProjectsUseCase,
    private readonly adminGetProjectUseCase: AdminGetProjectUseCase,
    private readonly adminListCollaboratorsUseCase: AdminListCollaboratorsUseCase,
    private readonly adminGetCollaboratorUseCase: AdminGetCollaboratorUseCase,
  ) {}

  @Get('projects')
  listProjects() {
    return this.adminListProjectsUseCase.execute();
  }

  @Get('projects/:id')
  getProject(@Param('id', UuidParamPipe) id: string) {
    return this.adminGetProjectUseCase.execute(id);
  }

  @Get('collaborators')
  listCollaborators() {
    return this.adminListCollaboratorsUseCase.execute();
  }

  @Get('collaborators/:id')
  getCollaborator(@Param('id', UuidParamPipe) id: string) {
    return this.adminGetCollaboratorUseCase.execute(id);
  }
}
