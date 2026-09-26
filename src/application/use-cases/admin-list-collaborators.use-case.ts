import { Inject, Injectable } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import {
  indexUsers,
  toAdminCollaboratorSummary,
} from '../mappers/admin-response.mapper';

/** ADMIN: todas las personas con perfil técnico (con o sin usuario) y su cuenta vinculada. */
@Injectable()
export class AdminListCollaboratorsUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute() {
    const [collaborators, users] = await Promise.all([
      this.collaboratorRepository.findAll(),
      this.userRepository.findAll(),
    ]);
    const usersById = indexUsers(users);

    return {
      collaborators: collaborators.map((collaborator) =>
        toAdminCollaboratorSummary(collaborator, usersById),
      ),
    };
  }
}
