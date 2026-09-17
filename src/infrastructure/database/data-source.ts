import 'dotenv/config';
import { DataSource } from 'typeorm';
import { CollaboratorOrmEntity } from './typeorm/collaborator.orm-entity';
import { ExperienceOrmEntity } from './typeorm/experience.orm-entity';
import { ProjectOrmEntity } from './typeorm/project.orm-entity';
import { SkillOrmEntity } from './typeorm/skill.orm-entity';
import { UserOrmEntity } from './typeorm/user.orm-entity';

const sslEnabled = process.env.DB_SSL === 'true';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    UserOrmEntity,
    CollaboratorOrmEntity,
    SkillOrmEntity,
    ExperienceOrmEntity,
    ProjectOrmEntity,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
});
