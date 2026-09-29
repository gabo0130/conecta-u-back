import { AdminCreateSkillUseCase } from './admin-create-skill.use-case';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { buildSkill, createMock } from '../../testing/test-doubles.testing';

describe('AdminCreateSkillUseCase', () => {
  const skillRepository = createMock<SkillRepository>();
  const useCase = new AdminCreateSkillUseCase(skillRepository);

  beforeEach(() => jest.clearAllMocks());

  it('creates the skill already ACTIVA by default', async () => {
    skillRepository.create.mockResolvedValue(buildSkill());

    await useCase.execute({ name: 'Rust', type: 'CONOCIMIENTO' });

    expect(skillRepository.create).toHaveBeenCalledWith({
      name: 'Rust',
      normalizedName: 'rust',
      type: 'CONOCIMIENTO',
      category: undefined,
      synonyms: undefined,
      status: 'ACTIVA',
    });
  });

  it('respects an explicit status', async () => {
    skillRepository.create.mockResolvedValue(buildSkill());

    await useCase.execute({
      name: 'Rust',
      type: 'CONOCIMIENTO',
      status: 'PENDIENTE',
    });

    expect(skillRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDIENTE' }),
    );
  });
});
