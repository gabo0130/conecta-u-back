import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaboratorSkillOrmEntity } from '../infrastructure/database/typeorm/collaborator-skill.orm-entity';
import { CollaboratorOrmEntity } from '../infrastructure/database/typeorm/collaborator.orm-entity';
import { DeliverableOrmEntity } from '../infrastructure/database/typeorm/deliverable.orm-entity';
import { ExperienceOrmEntity } from '../infrastructure/database/typeorm/experience.orm-entity';
import { ProgramOrmEntity } from '../infrastructure/database/typeorm/program.orm-entity';
import { ProjectCategoryOrmEntity } from '../infrastructure/database/typeorm/project-category.orm-entity';
import { ProjectTypeOrmEntity } from '../infrastructure/database/typeorm/project-type.orm-entity';
import { ProjectOrmEntity } from '../infrastructure/database/typeorm/project.orm-entity';
import { SkillOrmEntity } from '../infrastructure/database/typeorm/skill.orm-entity';
import { TypeOrmCollaboratorSkillRepository } from '../infrastructure/database/typeorm/typeorm-collaborator-skill.repository';
import { TypeOrmCollaboratorRepository } from '../infrastructure/database/typeorm/typeorm-collaborator.repository';
import { TypeOrmExperienceRepository } from '../infrastructure/database/typeorm/typeorm-experience.repository';
import { TypeOrmProgramRepository } from '../infrastructure/database/typeorm/typeorm-program.repository';
import { TypeOrmProjectCategoryRepository } from '../infrastructure/database/typeorm/typeorm-project-category.repository';
import { TypeOrmProjectTypeRepository } from '../infrastructure/database/typeorm/typeorm-project-type.repository';
import { TypeOrmProjectRepository } from '../infrastructure/database/typeorm/typeorm-project.repository';
import { TypeOrmSkillRepository } from '../infrastructure/database/typeorm/typeorm-skill.repository';
import { TypeOrmUnitOfWork } from '../infrastructure/database/typeorm/typeorm-unit-of-work';
import { TypeOrmUserRepository } from '../infrastructure/database/typeorm/typeorm-user.repository';
import { UserOrmEntity } from '../infrastructure/database/typeorm/user.orm-entity';
import {
  COLLABORATOR_REPOSITORY,
  COLLABORATOR_SKILL_REPOSITORY,
  EXPERIENCE_REPOSITORY,
  PROGRAM_REPOSITORY,
  PROJECT_CATEGORY_REPOSITORY,
  PROJECT_REPOSITORY,
  PROJECT_TYPE_REPOSITORY,
  SKILL_REPOSITORY,
  UNIT_OF_WORK,
  USER_REPOSITORY,
} from '../shared/interfaces/tokens';

const REPOSITORY_BINDINGS = [
  { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
  { provide: PROGRAM_REPOSITORY, useClass: TypeOrmProgramRepository },
  { provide: SKILL_REPOSITORY, useClass: TypeOrmSkillRepository },
  { provide: COLLABORATOR_REPOSITORY, useClass: TypeOrmCollaboratorRepository },
  {
    provide: COLLABORATOR_SKILL_REPOSITORY,
    useClass: TypeOrmCollaboratorSkillRepository,
  },
  { provide: EXPERIENCE_REPOSITORY, useClass: TypeOrmExperienceRepository },
  { provide: PROJECT_REPOSITORY, useClass: TypeOrmProjectRepository },
  { provide: PROJECT_TYPE_REPOSITORY, useClass: TypeOrmProjectTypeRepository },
  {
    provide: PROJECT_CATEGORY_REPOSITORY,
    useClass: TypeOrmProjectCategoryRepository,
  },
  { provide: UNIT_OF_WORK, useClass: TypeOrmUnitOfWork },
];

/** Registra una sola vez las entidades ORM y enlaza cada puerto del dominio con su adaptador TypeORM. */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      ProgramOrmEntity,
      SkillOrmEntity,
      CollaboratorOrmEntity,
      CollaboratorSkillOrmEntity,
      ExperienceOrmEntity,
      ProjectTypeOrmEntity,
      ProjectCategoryOrmEntity,
      ProjectOrmEntity,
      DeliverableOrmEntity,
    ]),
  ],
  providers: REPOSITORY_BINDINGS,
  exports: REPOSITORY_BINDINGS.map((binding) => binding.provide),
})
export class PersistenceModule {}
