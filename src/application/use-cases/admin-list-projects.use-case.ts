import { Inject, Injectable } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  PROJECT_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import {
  indexCollaboratorsByUser,
  indexUsers,
  toAdminProjectResponse,
} from '../mappers/admin-response.mapper';

/** ADMIN: todos los proyectos con su líder (nombre, correo y perfil técnico si lo tiene). */
@Injectable()
export class AdminListProjectsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute() {
    const [projects, users, collaborators] = await Promise.all([
      this.projectRepository.findAll(),
      this.userRepository.findAll(),
      this.collaboratorRepository.findAll(),
    ]);
    const usersById = indexUsers(users);
    const collaboratorIdByUserId = indexCollaboratorsByUser(collaborators);

    return {
      projects: projects.map((project) =>
        toAdminProjectResponse(project, usersById, collaboratorIdByUserId),
      ),
    };
  }
}
