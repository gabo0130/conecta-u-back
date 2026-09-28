import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ImportRunRepository } from '../../domain/repositories/import-run.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  IMPORT_RUN_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { toImportRunDetail } from '../mappers/admin-response.mapper';

/** ADMIN: detalle de una corrida de importación, con todas sus filas rechazadas. */
@Injectable()
export class AdminGetImportRunUseCase {
  constructor(
    @Inject(IMPORT_RUN_REPOSITORY)
    private readonly importRunRepository: ImportRunRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string) {
    const run = await this.importRunRepository.findById(id);
    if (!run) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    const user = run.importedByUserId
      ? await this.userRepository.findById(run.importedByUserId)
      : null;

    return toImportRunDetail(run, user ?? undefined);
  }
}
