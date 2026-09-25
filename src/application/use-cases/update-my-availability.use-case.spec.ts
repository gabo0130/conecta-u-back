import { NotFoundException } from '@nestjs/common';
import { UpdateMyAvailabilityUseCase } from './update-my-availability.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';

describe('UpdateMyAvailabilityUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByUserId' | 'update'>
  > = {
    findByUserId: jest.fn(),
    update: jest.fn(),
  };

  const useCase = new UpdateMyAvailabilityUseCase(collaboratorRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates availability status and weekly hours', async () => {
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
    collaboratorRepository.update.mockResolvedValue(
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
        'PARCIAL',
        5,
      ),
    );

    const result = await useCase.execute('u1', {
      availabilityStatus: 'PARCIAL',
      weeklyHours: 5,
    });

    expect(collaboratorRepository.update).toHaveBeenCalledWith('c1', {
      availabilityStatus: 'PARCIAL',
      weeklyHours: 5,
    });
    expect(result).toEqual({ availabilityStatus: 'PARCIAL', weeklyHours: 5 });
  });

  it('throws NotFoundException when the profile does not exist', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(
      useCase.execute('u1', {
        availabilityStatus: 'DISPONIBLE',
        weeklyHours: 0,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
