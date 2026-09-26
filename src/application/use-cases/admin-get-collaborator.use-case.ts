import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  PROJECT_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { toAdminCollaboratorDetail } from '../mappers/admin-response.mapper';

/** ADMIN: perfil técnico completo de cualquier persona, su cuenta y los proyectos que lidera. */
@Injectable()
export class AdminGetCollaboratorUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(collaboratorId: string) {
    const collaborator =
      await this.collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    const [user, ledProjects] = collaborator.userId
      ? await Promise.all([
          this.userRepository.findById(collaborator.userId),
          this.projectRepository.findByLeaderId(collaborator.userId),
        ])
      : [null, []];

    return toAdminCollaboratorDetail(
      collaborator,
      user ?? undefined,
      ledProjects,
    );
  }
}
