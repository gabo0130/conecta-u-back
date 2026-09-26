import { SearchSkillsUseCase } from './search-skills.use-case';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { createMock } from '../../testing/test-doubles.testing';

describe('SearchSkillsUseCase', () => {
  const skillRepository = createMock<SkillRepository>();

  const useCase = new SearchSkillsUseCase(skillRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes the query like the catalog before searching', async () => {
    skillRepository.search.mockResolvedValue([
      new SkillEntity('s1', 'Node.js', 'nodejs', 'CONOCIMIENTO'),
    ]);

    const result = await useCase.execute({
      q: '  Node.JS ',
      type: 'CONOCIMIENTO',
    });

    expect(skillRepository.search).toHaveBeenCalledWith({
      normalizedQuery: 'nodejs',
      type: 'CONOCIMIENTO',
    });
    expect(result.skills).toHaveLength(1);
  });

  it('searches without text filter when no query is sent', async () => {
    skillRepository.search.mockResolvedValue([]);

    await useCase.execute({});

    expect(skillRepository.search).toHaveBeenCalledWith({
      normalizedQuery: undefined,
      type: undefined,
    });
  });
});
