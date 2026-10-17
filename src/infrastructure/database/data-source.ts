import 'dotenv/config';
import { DataSource } from 'typeorm';
import { CollaboratorOrmEntity } from './typeorm/collaborator.orm-entity';
import { CollaboratorSkillOrmEntity } from './typeorm/collaborator-skill.orm-entity';
import { DeliverableOrmEntity } from './typeorm/deliverable.orm-entity';
import { ExperienceOrmEntity } from './typeorm/experience.orm-entity';
import { ImportRunOrmEntity } from './typeorm/import-run.orm-entity';
import { ProgramOrmEntity } from './typeorm/program.orm-entity';
import { ProjectCategoryOrmEntity } from './typeorm/project-category.orm-entity';
import { ProjectTypeOrmEntity } from './typeorm/project-type.orm-entity';
import { ProjectOrmEntity } from './typeorm/project.orm-entity';
import { ProjectAnalysisOrmEntity } from './typeorm/project-analysis.orm-entity';
import { RecommendationOrmEntity } from './typeorm/recommendation.orm-entity';
import { RequiredProfileSkillOrmEntity } from './typeorm/required-profile-skill.orm-entity';
import { RequiredProfileOrmEntity } from './typeorm/required-profile.orm-entity';
import { SkillOrmEntity } from './typeorm/skill.orm-entity';
import { UserOrmEntity } from './typeorm/user.orm-entity';

const sslEnabled = process.env.DB_SSL === 'true';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    UserOrmEntity,
    ProgramOrmEntity,
    CollaboratorOrmEntity,
    SkillOrmEntity,
    CollaboratorSkillOrmEntity,
    ExperienceOrmEntity,
    ProjectTypeOrmEntity,
    ProjectCategoryOrmEntity,
    ProjectOrmEntity,
    DeliverableOrmEntity,
    ImportRunOrmEntity,
    ProjectAnalysisOrmEntity,
    RequiredProfileOrmEntity,
    RequiredProfileSkillOrmEntity,
    RecommendationOrmEntity,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
});
