import { CreateSkillUseCase } from './create-skill.use-case';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';

describe('CreateSkillUseCase', () => {
  const skillRepository: jest.Mocked<Pick<SkillRepository, 'create'>> = {
    create: jest.fn(),
  };

  const useCase = new CreateSkillUseCase(skillRepository);

  it('creates a skill for the collaborator', async () => {
    skillRepository.create.mockResolvedValue(
      new SkillEntity('s1', '1', 'React', 'CONOCIMIENTO', 'medio'),
    );

    const result = await useCase.execute('1', {
      name: 'React',
      type: 'CONOCIMIENTO',
      level: 'medio',
    });

    expect(skillRepository.create).toHaveBeenCalledWith({
      collaboratorId: '1',
      name: 'React',
      type: 'CONOCIMIENTO',
      level: 'medio',
    });
    expect(result.name).toBe('React');
  });
});
