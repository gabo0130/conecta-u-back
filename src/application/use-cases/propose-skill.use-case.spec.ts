import { ProposeSkillUseCase } from './propose-skill.use-case';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';

describe('ProposeSkillUseCase', () => {
  const skillRepository: jest.Mocked<
    Pick<SkillRepository, 'findByNormalizedNameOrSynonym' | 'create'>
  > = {
    findByNormalizedNameOrSynonym: jest.fn(),
    create: jest.fn(),
  };

  const useCase = new ProposeSkillUseCase(skillRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the existing skill when the normalized name matches', async () => {
    const existing = new SkillEntity('s1', 'React', 'react', 'CONOCIMIENTO');
    skillRepository.findByNormalizedNameOrSynonym.mockResolvedValue(existing);

    const result = await useCase.execute({
      name: 'React',
      type: 'CONOCIMIENTO',
    });

    expect(result).toBe(existing);
    expect(skillRepository.create).not.toHaveBeenCalled();
  });

  it('creates a new PENDIENTE skill when there is no match', async () => {
    skillRepository.findByNormalizedNameOrSynonym.mockResolvedValue(null);
    skillRepository.create.mockResolvedValue(
      new SkillEntity(
        's2',
        'Rust',
        'rust',
        'CONOCIMIENTO',
        'OTRA',
        [],
        'PENDIENTE',
      ),
    );

    await useCase.execute({ name: 'Rust', type: 'CONOCIMIENTO' });

    expect(skillRepository.create).toHaveBeenCalledWith({
      name: 'Rust',
      normalizedName: 'rust',
      type: 'CONOCIMIENTO',
      category: 'OTRA',
      status: 'PENDIENTE',
    });
  });
});
