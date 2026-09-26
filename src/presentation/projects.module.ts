import { Module } from '@nestjs/common';
import { CreateProjectUseCase } from '../application/use-cases/create-project.use-case';
import { GetProjectByIdUseCase } from '../application/use-cases/get-project-by-id.use-case';
import { ListMyProjectsUseCase } from '../application/use-cases/list-my-projects.use-case';
import { UpdateProjectUseCase } from '../application/use-cases/update-project.use-case';
import { ProjectsController } from './controllers/projects.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [ProjectsController],
  providers: [
    CreateProjectUseCase,
    GetProjectByIdUseCase,
    ListMyProjectsUseCase,
    UpdateProjectUseCase,
  ],
})
export class ProjectsModule {}
