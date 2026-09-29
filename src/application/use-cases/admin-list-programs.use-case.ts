import { Inject, Injectable } from '@nestjs/common';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import { PROGRAM_REPOSITORY } from '../../shared/interfaces/tokens';

/** ADMIN: todos los programas, activos e inactivos (para poder reactivarlos). */
@Injectable()
export class AdminListProgramsUseCase {
  constructor(
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
  ) {}

  async execute() {
    return { programs: await this.programRepository.findAll(false) };
  }
}
