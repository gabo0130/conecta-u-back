import { NotFoundException } from '@nestjs/common';
import { UpdateMyCollaboratorSkillUseCase } from './update-my-collaborator-skill.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { CollaboratorSkillEntity } from '../../domain/entities/collaborator-skill.entity';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { CollaboratorSkillRepository } from '../../domain/repositories/collaborator-skill.repository.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';

describe('UpdateMyCollaboratorSkillUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByUserId'>
  > = {
    findByUserId: jest.fn(),
  };
  const skillRepository: jest.Mocked<Pick<SkillRepository, 'findById'>> = {
    findById: jest.fn(),
  };
  const collaboratorSkillRepository: jest.Mocked<
    Pick<CollaboratorSkillRepository, 'findById' | 'update'>
  > = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const useCase = new UpdateMyCollaboratorSkillUseCase(
    collaboratorRepository,
    skillRepository,
    collaboratorSkillRepository,
  );

  const dto = {
    skillId: 's1',
    level: 'EXPERTO' as const,
    experienceMonths: 24,
  };
  const skill = new SkillEntity('s1', 'React', 'react', 'CONOCIMIENTO');
  const collaborator = new CollaboratorEntity(
    'c1',
    'ana@example.com',
    'u1',
    'Ana',
    'Gómez',
    'ESTUDIANTE',
    'prog-1',
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the entry when it belongs to the collaborator', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(collaborator);
    collaboratorSkillRepository.findById.mockResolvedValue(
      new CollaboratorSkillEntity('cs1', 'c1', skill, 'AVANZADO', 12),
    );
    skillRepository.findById.mockResolvedValue(skill);

    await useCase.execute('u1', 'cs1', dto);

    expect(collaboratorSkillRepository.update).toHaveBeenCalledWith('cs1', {
      skillId: 's1',
      level: 'EXPERTO',
      experienceMonths: 24,
      lastUsedYear: null,
    });
  });

  it('throws NotFoundException when the entry belongs to another collaborator', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(collaborator);
    collaboratorSkillRepository.findById.mockResolvedValue(
      new CollaboratorSkillEntity(
        'cs1',
        'other-collaborator',
        skill,
        'AVANZADO',
        12,
      ),
    );

    await expect(useCase.execute('u1', 'cs1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException when the profile does not exist', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('u1', 'cs1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
