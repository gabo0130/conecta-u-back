import { Module } from '@nestjs/common';
import { AdminGetCollaboratorUseCase } from '../application/use-cases/admin-get-collaborator.use-case';
import { AdminGetProjectUseCase } from '../application/use-cases/admin-get-project.use-case';
import { AdminListCollaboratorsUseCase } from '../application/use-cases/admin-list-collaborators.use-case';
import { AdminListProjectsUseCase } from '../application/use-cases/admin-list-projects.use-case';
import { AdminController } from './controllers/admin.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [AdminController],
  providers: [
    AdminListProjectsUseCase,
    AdminGetProjectUseCase,
    AdminListCollaboratorsUseCase,
    AdminGetCollaboratorUseCase,
  ],
})
export class AdminModule {}
