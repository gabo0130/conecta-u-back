import { AdminListProgramsUseCase } from './admin-list-programs.use-case';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import { buildProgram, createMock } from '../../testing/test-doubles.testing';

describe('AdminListProgramsUseCase', () => {
  const programRepository = createMock<ProgramRepository>();
  const useCase = new AdminListProgramsUseCase(programRepository);

  beforeEach(() => jest.clearAllMocks());

  it('lists all programs, including inactive ones', async () => {
    programRepository.findAll.mockResolvedValue([
      buildProgram({ active: false }),
    ]);

    const result = await useCase.execute();

    expect(programRepository.findAll).toHaveBeenCalledWith(false);
    expect(result.programs).toHaveLength(1);
  });
});
