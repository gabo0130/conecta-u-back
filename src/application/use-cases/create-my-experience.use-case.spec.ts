import { NotFoundException } from '@nestjs/common';
import { CreateMyExperienceUseCase } from './create-my-experience.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { ExperienceEntity } from '../../domain/entities/experience.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';

describe('CreateMyExperienceUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByUserId'>
  > = {
    findByUserId: jest.fn(),
  };
  const experienceRepository: jest.Mocked<
    Pick<ExperienceRepository, 'create'>
  > = {
    create: jest.fn(),
  };

  const useCase = new CreateMyExperienceUseCase(
    collaboratorRepository,
    experienceRepository,
  );

  const dto = {
    type: 'PRACTICA' as const,
    role: 'Dev',
    organization: 'Empresa',
    startDate: '2025-01-01',
    current: true,
    weeklyHours: 10,
    level: 'INTERMEDIO' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates the experience and computes durationMonths', async () => {
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
    experienceRepository.create.mockResolvedValue(
      new ExperienceEntity(
        'e1',
        'c1',
        'PRACTICA',
        'Dev',
        'Empresa',
        '2025-01-01',
        '2025-07-01',
        false,
        10,
        'INTERMEDIO',
      ),
    );

    const result = await useCase.execute('u1', dto);

    expect(experienceRepository.create).toHaveBeenCalledWith({
      collaboratorId: 'c1',
      type: 'PRACTICA',
      role: 'Dev',
      organization: 'Empresa',
      startDate: '2025-01-01',
      endDate: null,
      current: true,
      weeklyHours: 10,
      level: 'INTERMEDIO',
      description: null,
      skillIds: undefined,
    });
    expect(result.durationMonths).toBe(6);
  });

  it('throws NotFoundException when the profile does not exist', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('u1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
