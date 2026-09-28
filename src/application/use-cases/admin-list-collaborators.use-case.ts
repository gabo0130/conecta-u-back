import { Inject, Injectable } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import {
  toPageMeta,
  type PageParams,
} from '../../shared/pagination/pagination.util';
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

  async execute(params: PageParams) {
    const { items: collaborators, total } =
      await this.collaboratorRepository.findAll(params);

    // Solo se resuelven las cuentas vinculadas a esta página, no toda la tabla de usuarios.
    const userIds = collaborators
      .map((collaborator) => collaborator.userId)
      .filter((userId): userId is string => Boolean(userId));
    const users = await this.userRepository.findByIds(userIds);
    const usersById = indexUsers(users);

    return {
      collaborators: collaborators.map((collaborator) =>
        toAdminCollaboratorSummary(collaborator, usersById),
      ),
      meta: toPageMeta(params.page, params.pageSize, total),
    };
  }
}
