import { NotFoundException } from '@nestjs/common';
import { DeleteSkillUseCase } from './delete-skill.use-case';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';

describe('DeleteSkillUseCase', () => {
  const skillRepository: jest.Mocked<
    Pick<SkillRepository, 'findById' | 'delete'>
  > = {
    findById: jest.fn(),
    delete: jest.fn(),
  };

  const useCase = new DeleteSkillUseCase(skillRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the skill when owned by the collaborator', async () => {
    skillRepository.findById.mockResolvedValue(
      new SkillEntity('s1', '1', 'React', 'CONOCIMIENTO', null),
    );
    skillRepository.delete.mockResolvedValue(true);

    await useCase.execute('1', 's1');

    expect(skillRepository.delete).toHaveBeenCalledWith('s1');
  });

  it('throws NotFoundException when skill belongs to another collaborator', async () => {
    skillRepository.findById.mockResolvedValue(
      new SkillEntity('s1', '2', 'React', 'CONOCIMIENTO', null),
    );

    await expect(useCase.execute('1', 's1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
