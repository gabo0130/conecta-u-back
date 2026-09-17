import { NotFoundException } from '@nestjs/common';
import { UpdateSkillUseCase } from './update-skill.use-case';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';

describe('UpdateSkillUseCase', () => {
  const skillRepository: jest.Mocked<
    Pick<SkillRepository, 'findById' | 'update'>
  > = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const useCase = new UpdateSkillUseCase(skillRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the skill when owned by the collaborator', async () => {
    skillRepository.findById.mockResolvedValue(
      new SkillEntity('s1', '1', 'React', 'CONOCIMIENTO', null),
    );
    skillRepository.update.mockResolvedValue(
      new SkillEntity('s1', '1', 'React', 'COMPETENCIA', 'alto'),
    );

    const result = await useCase.execute('1', 's1', {
      name: 'React',
      type: 'COMPETENCIA',
      level: 'alto',
    });

    expect(result.type).toBe('COMPETENCIA');
  });

  it('throws NotFoundException when skill does not exist', async () => {
    skillRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('1', 's1', { name: 'React', type: 'CONOCIMIENTO' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when skill belongs to another collaborator', async () => {
    skillRepository.findById.mockResolvedValue(
      new SkillEntity('s1', '2', 'React', 'CONOCIMIENTO', null),
    );

    await expect(
      useCase.execute('1', 's1', { name: 'React', type: 'CONOCIMIENTO' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
