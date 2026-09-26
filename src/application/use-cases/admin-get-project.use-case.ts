import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  PROJECT_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { toAdminProjectResponse } from '../mappers/admin-response.mapper';

/** ADMIN: cualquier proyecto (sin validar dueño) con su líder. */
@Injectable()
export class AdminGetProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute(projectId: string) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    const [leader, leaderProfile] = await Promise.all([
      this.userRepository.findById(project.leaderId),
      this.collaboratorRepository.findByUserId(project.leaderId),
    ]);

    return toAdminProjectResponse(
      project,
      new Map(leader ? [[leader.id, leader]] : []),
      new Map(leaderProfile ? [[project.leaderId, leaderProfile.id]] : []),
    );
  }
}
