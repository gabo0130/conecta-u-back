import { AdminListSkillsUseCase } from './admin-list-skills.use-case';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { buildSkill, createMock } from '../../testing/test-doubles.testing';

describe('AdminListSkillsUseCase', () => {
  const skillRepository = createMock<SkillRepository>();
  const useCase = new AdminListSkillsUseCase(skillRepository);

  beforeEach(() => jest.clearAllMocks());

  it('pages the catalog and normalizes the search text', async () => {
    skillRepository.findAllPaged.mockResolvedValue({
      items: [buildSkill()],
      total: 1,
    });

    const result = await useCase.execute({
      page: 1,
      pageSize: 20,
      q: 'Programación',
      type: 'CONOCIMIENTO',
      status: 'PENDIENTE',
    });

    expect(skillRepository.findAllPaged).toHaveBeenCalledWith(
      { page: 1, pageSize: 20 },
      {
        normalizedQuery: 'programacion',
        type: 'CONOCIMIENTO',
        category: undefined,
        status: 'PENDIENTE',
      },
    );
    expect(result.meta).toEqual({
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });
  });
});
