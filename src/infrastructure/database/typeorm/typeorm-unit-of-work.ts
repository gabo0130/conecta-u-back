import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import type {
  TransactionalRepositories,
  UnitOfWork,
} from '../../../domain/repositories/unit-of-work.interface';
import { CollaboratorSkillOrmEntity } from './collaborator-skill.orm-entity';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { ExperienceOrmEntity } from './experience.orm-entity';
import { SkillOrmEntity } from './skill.orm-entity';
import { TypeOrmCollaboratorSkillRepository } from './typeorm-collaborator-skill.repository';
import { TypeOrmCollaboratorRepository } from './typeorm-collaborator.repository';
import { TypeOrmExperienceRepository } from './typeorm-experience.repository';
import { TypeOrmSkillRepository } from './typeorm-skill.repository';
import { TypeOrmUserRepository } from './typeorm-user.repository';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  run<T>(
    work: (repositories: TransactionalRepositories) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work(this.repositoriesFor(manager)),
    );
  }

  private repositoriesFor(manager: EntityManager): TransactionalRepositories {
    const skills = manager.getRepository(SkillOrmEntity);
    return {
      users: new TypeOrmUserRepository(manager.getRepository(UserOrmEntity)),
      collaborators: new TypeOrmCollaboratorRepository(
        manager.getRepository(CollaboratorOrmEntity),
      ),
      collaboratorSkills: new TypeOrmCollaboratorSkillRepository(
        manager.getRepository(CollaboratorSkillOrmEntity),
      ),
      experiences: new TypeOrmExperienceRepository(
        manager.getRepository(ExperienceOrmEntity),
        skills,
      ),
      skills: new TypeOrmSkillRepository(skills),
    };
  }
}
