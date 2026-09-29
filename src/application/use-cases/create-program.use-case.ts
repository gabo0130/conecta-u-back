import { Inject, Injectable } from '@nestjs/common';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import { PROGRAM_REPOSITORY } from '../../shared/interfaces/tokens';
import { CreateProgramDto } from '../dto/create-program.dto';

/** ADMIN: crea un programa académico (RF22). */
@Injectable()
export class CreateProgramUseCase {
  constructor(
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
  ) {}

  async execute(data: CreateProgramDto) {
    return this.programRepository.create({
      code: data.code,
      name: data.name,
      faculty: data.faculty,
    });
  }
}
