import { ListMySkillsUseCase } from './list-my-skills.use-case';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';

describe('ListMySkillsUseCase', () => {
  const skillRepository: jest.Mocked<
    Pick<SkillRepository, 'findByCollaboratorId'>
  > = {
    findByCollaboratorId: jest.fn(),
  };

  const useCase = new ListMySkillsUseCase(skillRepository);

  it('returns skills for the collaborator', async () => {
    skillRepository.findByCollaboratorId.mockResolvedValue([
      new SkillEntity('s1', '1', 'React', 'CONOCIMIENTO', null),
    ]);

    const result = await useCase.execute('1');

    expect(skillRepository.findByCollaboratorId).toHaveBeenCalledWith('1');
    expect(result.skills).toHaveLength(1);
  });
});
