import { Module } from '@nestjs/common';
import { ListProgramsUseCase } from '../application/use-cases/list-programs.use-case';
import { ListProjectCategoriesUseCase } from '../application/use-cases/list-project-categories.use-case';
import { ListProjectTypesUseCase } from '../application/use-cases/list-project-types.use-case';
import { ProposeSkillUseCase } from '../application/use-cases/propose-skill.use-case';
import { SearchSkillsUseCase } from '../application/use-cases/search-skills.use-case';
import { CatalogsController } from './controllers/catalogs.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [CatalogsController],
  providers: [
    ListProgramsUseCase,
    ListProjectCategoriesUseCase,
    ListProjectTypesUseCase,
    ProposeSkillUseCase,
    SearchSkillsUseCase,
  ],
})
export class CatalogsModule {}
