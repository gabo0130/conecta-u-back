import { NotFoundException } from '@nestjs/common';
import { DeleteMyExperienceUseCase } from './delete-my-experience.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { ExperienceEntity } from '../../domain/entities/experience.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';

describe('DeleteMyExperienceUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByUserId'>
  > = {
    findByUserId: jest.fn(),
  };
  const experienceRepository: jest.Mocked<
    Pick<ExperienceRepository, 'findById' | 'delete'>
  > = {
    findById: jest.fn(),
    delete: jest.fn(),
  };

  const useCase = new DeleteMyExperienceUseCase(
    collaboratorRepository,
    experienceRepository,
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the experience when it belongs to the collaborator', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(collaborator);
    experienceRepository.findById.mockResolvedValue(
      new ExperienceEntity(
        'e1',
        'c1',
        'PRACTICA',
        'Dev',
        'Empresa',
        '2025-01-01',
        null,
        true,
        10,
        'INTERMEDIO',
      ),
    );

    await useCase.execute('u1', 'e1');

    expect(experienceRepository.delete).toHaveBeenCalledWith('e1');
  });

  it('throws NotFoundException when the experience belongs to another collaborator', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(collaborator);
    experienceRepository.findById.mockResolvedValue(
      new ExperienceEntity(
        'e1',
        'other-collaborator',
        'PRACTICA',
        'Dev',
        'Empresa',
        '2025-01-01',
        null,
        true,
        10,
        'INTERMEDIO',
      ),
    );

    await expect(useCase.execute('u1', 'e1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException when the profile does not exist', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('u1', 'e1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
