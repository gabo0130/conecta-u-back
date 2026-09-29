import { Module } from '@nestjs/common';
import { AdminCreateSkillUseCase } from '../application/use-cases/admin-create-skill.use-case';
import { AdminListProgramsUseCase } from '../application/use-cases/admin-list-programs.use-case';
import { AdminListProjectCategoriesUseCase } from '../application/use-cases/admin-list-project-categories.use-case';
import { AdminListProjectTypesUseCase } from '../application/use-cases/admin-list-project-types.use-case';
import { AdminListSkillsUseCase } from '../application/use-cases/admin-list-skills.use-case';
import { AdminUpdateSkillUseCase } from '../application/use-cases/admin-update-skill.use-case';
import { CreateProgramUseCase } from '../application/use-cases/create-program.use-case';
import { CreateProjectCategoryUseCase } from '../application/use-cases/create-project-category.use-case';
import { CreateProjectTypeUseCase } from '../application/use-cases/create-project-type.use-case';
import { ListProgramsUseCase } from '../application/use-cases/list-programs.use-case';
import { ListProjectCategoriesUseCase } from '../application/use-cases/list-project-categories.use-case';
import { ListProjectTypesUseCase } from '../application/use-cases/list-project-types.use-case';
import { ProposeSkillUseCase } from '../application/use-cases/propose-skill.use-case';
import { SearchSkillsUseCase } from '../application/use-cases/search-skills.use-case';
import { UpdateProgramUseCase } from '../application/use-cases/update-program.use-case';
import { UpdateProjectCategoryUseCase } from '../application/use-cases/update-project-category.use-case';
import { UpdateProjectTypeUseCase } from '../application/use-cases/update-project-type.use-case';
import { AdminCatalogsController } from './controllers/admin-catalogs.controller';
import { CatalogsController } from './controllers/catalogs.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [CatalogsController, AdminCatalogsController],
  providers: [
    ListProgramsUseCase,
    ListProjectCategoriesUseCase,
    ListProjectTypesUseCase,
    ProposeSkillUseCase,
    SearchSkillsUseCase,
    AdminListProgramsUseCase,
    CreateProgramUseCase,
    UpdateProgramUseCase,
    AdminListProjectTypesUseCase,
    CreateProjectTypeUseCase,
    UpdateProjectTypeUseCase,
    AdminListProjectCategoriesUseCase,
    CreateProjectCategoryUseCase,
    UpdateProjectCategoryUseCase,
    AdminListSkillsUseCase,
    AdminCreateSkillUseCase,
    AdminUpdateSkillUseCase,
  ],
})
export class CatalogsModule {}
