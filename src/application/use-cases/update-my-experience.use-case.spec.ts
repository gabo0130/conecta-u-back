import { NotFoundException } from '@nestjs/common';
import { UpdateMyExperienceUseCase } from './update-my-experience.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { ExperienceEntity } from '../../domain/entities/experience.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';

describe('UpdateMyExperienceUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByUserId'>
  > = {
    findByUserId: jest.fn(),
  };
  const experienceRepository: jest.Mocked<
    Pick<ExperienceRepository, 'findById' | 'update'>
  > = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const useCase = new UpdateMyExperienceUseCase(
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

  const dto = {
    type: 'PRACTICA' as const,
    role: 'Dev senior',
    organization: 'Empresa',
    startDate: '2025-01-01',
    current: false,
    endDate: '2025-07-01',
    weeklyHours: 10,
    level: 'AVANZADO' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the experience when it belongs to the collaborator', async () => {
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
    experienceRepository.update.mockResolvedValue(
      new ExperienceEntity(
        'e1',
        'c1',
        'PRACTICA',
        'Dev senior',
        'Empresa',
        '2025-01-01',
        '2025-07-01',
        false,
        10,
        'AVANZADO',
      ),
    );

    const result = await useCase.execute('u1', 'e1', dto);

    expect(result.role).toBe('Dev senior');
    expect(result.durationMonths).toBe(6);
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

    await expect(useCase.execute('u1', 'e1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException when the profile does not exist', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('u1', 'e1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
