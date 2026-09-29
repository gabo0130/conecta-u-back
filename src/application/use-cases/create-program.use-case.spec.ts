import { CreateProgramUseCase } from './create-program.use-case';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import { buildProgram, createMock } from '../../testing/test-doubles.testing';

describe('CreateProgramUseCase', () => {
  const programRepository = createMock<ProgramRepository>();
  const useCase = new CreateProgramUseCase(programRepository);

  beforeEach(() => jest.clearAllMocks());

  it('creates a program with the given code, name and faculty', async () => {
    programRepository.create.mockResolvedValue(buildProgram());

    await useCase.execute({
      code: 'ISI',
      name: 'Ingeniería de Sistemas',
      faculty: 'Ingeniería',
    });

    expect(programRepository.create).toHaveBeenCalledWith({
      code: 'ISI',
      name: 'Ingeniería de Sistemas',
      faculty: 'Ingeniería',
    });
  });
});
