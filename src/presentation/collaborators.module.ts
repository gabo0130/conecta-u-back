import { Module } from '@nestjs/common';
import { AddMyCollaboratorSkillUseCase } from '../application/use-cases/add-my-collaborator-skill.use-case';
import { CreateMyCollaboratorProfileUseCase } from '../application/use-cases/create-my-collaborator-profile.use-case';
import { CreateMyExperienceUseCase } from '../application/use-cases/create-my-experience.use-case';
import { DeleteMyCollaboratorSkillUseCase } from '../application/use-cases/delete-my-collaborator-skill.use-case';
import { DeleteMyExperienceUseCase } from '../application/use-cases/delete-my-experience.use-case';
import { GetMyCollaboratorProfileUseCase } from '../application/use-cases/get-my-collaborator-profile.use-case';
import { ListMyCollaboratorSkillsUseCase } from '../application/use-cases/list-my-collaborator-skills.use-case';
import { UpdateMyAvailabilityUseCase } from '../application/use-cases/update-my-availability.use-case';
import { UpdateMyCollaboratorProfileUseCase } from '../application/use-cases/update-my-collaborator-profile.use-case';
import { UpdateMyCollaboratorSkillUseCase } from '../application/use-cases/update-my-collaborator-skill.use-case';
import { UpdateMyExperienceUseCase } from '../application/use-cases/update-my-experience.use-case';
import { CollaboratorsController } from './controllers/collaborators.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [CollaboratorsController],
  providers: [
    AddMyCollaboratorSkillUseCase,
    CreateMyCollaboratorProfileUseCase,
    CreateMyExperienceUseCase,
    DeleteMyCollaboratorSkillUseCase,
    DeleteMyExperienceUseCase,
    GetMyCollaboratorProfileUseCase,
    ListMyCollaboratorSkillsUseCase,
    UpdateMyAvailabilityUseCase,
    UpdateMyCollaboratorProfileUseCase,
    UpdateMyCollaboratorSkillUseCase,
    UpdateMyExperienceUseCase,
  ],
})
export class CollaboratorsModule {}
