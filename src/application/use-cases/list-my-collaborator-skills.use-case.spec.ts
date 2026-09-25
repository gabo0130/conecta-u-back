import { NotFoundException } from '@nestjs/common';
import { ListMyCollaboratorSkillsUseCase } from './list-my-collaborator-skills.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { CollaboratorSkillEntity } from '../../domain/entities/collaborator-skill.entity';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';

describe('ListMyCollaboratorSkillsUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByUserId'>
  > = {
    findByUserId: jest.fn(),
  };

  const useCase = new ListMyCollaboratorSkillsUseCase(collaboratorRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the collaborator skills', async () => {
    const skill = new SkillEntity('s1', 'React', 'react', 'CONOCIMIENTO');
    collaboratorRepository.findByUserId.mockResolvedValue(
      new CollaboratorEntity(
        'c1',
        'ana@example.com',
        'u1',
        'Ana',
        'Gómez',
        'ESTUDIANTE',
        'prog-1',
        undefined,
        undefined,
        undefined,
        undefined,
        'DISPONIBLE',
        0,
        false,
        null,
        'REGISTRO',
        true,
        [new CollaboratorSkillEntity('cs1', 'c1', skill, 'AVANZADO', 12, 2026)],
      ),
    );

    const result = await useCase.execute('u1');

    expect(result.skills).toEqual([
      {
        id: 'cs1',
        skill: {
          id: 's1',
          name: 'React',
          type: 'CONOCIMIENTO',
          category: 'OTRA',
        },
        level: 'AVANZADO',
        experienceMonths: 12,
        lastUsedYear: 2026,
      },
    ]);
  });

  it('throws NotFoundException when the profile does not exist', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
