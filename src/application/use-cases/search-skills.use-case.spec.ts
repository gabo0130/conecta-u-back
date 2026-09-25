import { SearchSkillsUseCase } from './search-skills.use-case';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';

describe('SearchSkillsUseCase', () => {
  const skillRepository: jest.Mocked<Pick<SkillRepository, 'search'>> = {
    search: jest.fn(),
  };

  const useCase = new SearchSkillsUseCase(skillRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the query and type to the repository', async () => {
    skillRepository.search.mockResolvedValue([
      new SkillEntity('s1', 'React', 'react', 'CONOCIMIENTO'),
    ]);

    const result = await useCase.execute('rea', 'CONOCIMIENTO');

    expect(skillRepository.search).toHaveBeenCalledWith({
      query: 'rea',
      type: 'CONOCIMIENTO',
    });
    expect(result.skills).toHaveLength(1);
  });
});
