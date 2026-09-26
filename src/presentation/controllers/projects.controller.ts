import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateProjectDto } from '../../application/dto/create-project.dto';
import { UpdateProjectDto } from '../../application/dto/update-project.dto';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { GetProjectByIdUseCase } from '../../application/use-cases/get-project-by-id.use-case';
import { ListMyProjectsUseCase } from '../../application/use-cases/list-my-projects.use-case';
import { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['LIDER'] })
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly listMyProjectsUseCase: ListMyProjectsUseCase,
    private readonly getProjectByIdUseCase: GetProjectByIdUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
  ) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateProjectDto) {
    return this.createProjectUseCase.execute(request.user!.userId, dto);
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.listMyProjectsUseCase.execute(request.user!.userId);
  }

  @Get(':id')
  getById(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
  ) {
    return this.getProjectByIdUseCase.execute(request.user!.userId, id);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.updateProjectUseCase.execute(request.user!.userId, id, dto);
  }
}
