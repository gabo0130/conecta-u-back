import { NotFoundException } from '@nestjs/common';
import { AddMyCollaboratorSkillUseCase } from './add-my-collaborator-skill.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { CollaboratorSkillRepository } from '../../domain/repositories/collaborator-skill.repository.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';

describe('AddMyCollaboratorSkillUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByUserId'>
  > = {
    findByUserId: jest.fn(),
  };
  const skillRepository: jest.Mocked<Pick<SkillRepository, 'findById'>> = {
    findById: jest.fn(),
  };
  const collaboratorSkillRepository: jest.Mocked<
    Pick<CollaboratorSkillRepository, 'create'>
  > = {
    create: jest.fn(),
  };

  const useCase = new AddMyCollaboratorSkillUseCase(
    collaboratorRepository,
    skillRepository,
    collaboratorSkillRepository,
  );

  const dto = {
    skillId: 's1',
    level: 'AVANZADO' as const,
    experienceMonths: 12,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds a skill to the collaborator profile', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(
      new CollaboratorEntity(
        'c1',
        'ana@example.com',
        'u1',
        'Ana',
        'Gómez',
        'ESTUDIANTE',
        'prog-1',
      ),
    );
    skillRepository.findById.mockResolvedValue(
      new SkillEntity('s1', 'React', 'react', 'CONOCIMIENTO'),
    );

    await useCase.execute('u1', dto);

    expect(collaboratorSkillRepository.create).toHaveBeenCalledWith({
      collaboratorId: 'c1',
      skillId: 's1',
      level: 'AVANZADO',
      experienceMonths: 12,
      lastUsedYear: null,
    });
  });

  it('throws NotFoundException when the profile does not exist', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('u1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException when the skill does not exist', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(
      new CollaboratorEntity(
        'c1',
        'ana@example.com',
        'u1',
        'Ana',
        'Gómez',
        'ESTUDIANTE',
        'prog-1',
      ),
    );
    skillRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('u1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
