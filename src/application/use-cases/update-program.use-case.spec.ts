import { NotFoundException } from '@nestjs/common';
import { UpdateProgramUseCase } from './update-program.use-case';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import { buildProgram, createMock } from '../../testing/test-doubles.testing';

describe('UpdateProgramUseCase', () => {
  const programRepository = createMock<ProgramRepository>();
  const useCase = new UpdateProgramUseCase(programRepository);

  beforeEach(() => jest.clearAllMocks());

  it('updates the program and returns it', async () => {
    programRepository.update.mockResolvedValue(buildProgram({ active: false }));

    const result = await useCase.execute('program-1', { active: false });

    expect(programRepository.update).toHaveBeenCalledWith('program-1', {
      active: false,
    });
    expect(result.active).toBe(false);
  });

  it('throws 404 when the program does not exist', async () => {
    programRepository.update.mockResolvedValue(null);

    await expect(useCase.execute('missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
