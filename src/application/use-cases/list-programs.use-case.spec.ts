import { ListProgramsUseCase } from './list-programs.use-case';
import { ProgramEntity } from '../../domain/entities/program.entity';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';

describe('ListProgramsUseCase', () => {
  const programRepository: jest.Mocked<Pick<ProgramRepository, 'findAll'>> = {
    findAll: jest.fn(),
  };

  const useCase = new ListProgramsUseCase(programRepository);

  it('returns the active programs', async () => {
    programRepository.findAll.mockResolvedValue([
      new ProgramEntity('p1', 'ISI', 'Ingeniería de Sistemas'),
    ]);

    const result = await useCase.execute();

    expect(result.programs).toHaveLength(1);
  });
});
