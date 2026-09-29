import { Inject, Injectable } from '@nestjs/common';
import type { ImportRunRepository } from '../../domain/repositories/import-run.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  IMPORT_RUN_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import {
  toPageMeta,
  type PageParams,
} from '../../shared/pagination/pagination.util';
import {
  indexUsers,
  toImportRunSummary,
} from '../mappers/admin-response.mapper';

/** ADMIN: historial de importaciones de colaboradores (RF24), más reciente primero. */
@Injectable()
export class AdminListImportRunsUseCase {
  constructor(
    @Inject(IMPORT_RUN_REPOSITORY)
    private readonly importRunRepository: ImportRunRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(params: PageParams) {
    const { items: runs, total } =
      await this.importRunRepository.findAll(params);

    // Solo se resuelven los admins de esta página, no toda la tabla de usuarios.
    const userIds = runs
      .map((run) => run.importedByUserId)
      .filter((userId): userId is string => Boolean(userId));
    const users = await this.userRepository.findByIds(userIds);
    const usersById = indexUsers(users);

    return {
      runs: runs.map((run) => toImportRunSummary(run, usersById)),
      meta: toPageMeta(params.page, params.pageSize, total),
    };
  }
}
