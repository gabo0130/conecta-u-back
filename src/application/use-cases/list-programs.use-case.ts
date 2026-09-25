import { Inject, Injectable } from '@nestjs/common';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import { PROGRAM_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class ListProgramsUseCase {
  constructor(
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
  ) {}

  async execute() {
    return { programs: await this.programRepository.findAll() };
  }
}
