import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import { PROGRAM_REPOSITORY } from '../../shared/interfaces/tokens';
import { UpdateProgramDto } from '../dto/update-program.dto';

/** ADMIN: edita o activa/desactiva un programa académico (RF22). */
@Injectable()
export class UpdateProgramUseCase {
  constructor(
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
  ) {}

  async execute(id: string, data: UpdateProgramDto) {
    const program = await this.programRepository.update(id, data);
    if (!program) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }
    return program;
  }
}
