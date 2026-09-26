import type { CollaboratorSkillRepository } from './collaborator-skill.repository.interface';
import type { CollaboratorRepository } from './collaborator.repository.interface';
import type { ExperienceRepository } from './experience.repository.interface';
import type { SkillRepository } from './skill.repository.interface';
import type { UserRepository } from './user.repository.interface';

/** Repositorios que comparten la misma transacción dentro de `UnitOfWork.run`. */
export interface TransactionalRepositories {
  users: UserRepository;
  collaborators: CollaboratorRepository;
  collaboratorSkills: CollaboratorSkillRepository;
  experiences: ExperienceRepository;
  skills: SkillRepository;
}

/**
 * Ejecuta `work` en una sola transacción: si lanza, no queda nada escrito.
 * Usar solo los repositorios que recibe `work`; los inyectados fuera de él no participan.
 */
export interface UnitOfWork {
  run<T>(
    work: (repositories: TransactionalRepositories) => Promise<T>,
  ): Promise<T>;
}
