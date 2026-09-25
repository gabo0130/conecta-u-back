import { NotFoundException } from '@nestjs/common';
import { DeleteMyCollaboratorSkillUseCase } from './delete-my-collaborator-skill.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { CollaboratorSkillEntity } from '../../domain/entities/collaborator-skill.entity';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { CollaboratorSkillRepository } from '../../domain/repositories/collaborator-skill.repository.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';

describe('DeleteMyCollaboratorSkillUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByUserId'>
  > = {
    findByUserId: jest.fn(),
  };
  const collaboratorSkillRepository: jest.Mocked<
    Pick<CollaboratorSkillRepository, 'findById' | 'delete'>
  > = {
    findById: jest.fn(),
    delete: jest.fn(),
  };

  const useCase = new DeleteMyCollaboratorSkillUseCase(
    collaboratorRepository,
    collaboratorSkillRepository,
  );

  const collaborator = new CollaboratorEntity(
    'c1',
    'ana@example.com',
    'u1',
    'Ana',
    'Gómez',
    'ESTUDIANTE',
    'prog-1',
  );
  const skill = new SkillEntity('s1', 'React', 'react', 'CONOCIMIENTO');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the entry when it belongs to the collaborator', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(collaborator);
    collaboratorSkillRepository.findById.mockResolvedValue(
      new CollaboratorSkillEntity('cs1', 'c1', skill, 'AVANZADO', 12),
    );

    await useCase.execute('u1', 'cs1');

    expect(collaboratorSkillRepository.delete).toHaveBeenCalledWith('cs1');
  });

  it('throws NotFoundException when the entry belongs to another collaborator', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(collaborator);
    collaboratorSkillRepository.findById.mockResolvedValue(
      new CollaboratorSkillEntity('cs1', 'other', skill, 'AVANZADO', 12),
    );

    await expect(useCase.execute('u1', 'cs1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException when the profile does not exist', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('u1', 'cs1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
