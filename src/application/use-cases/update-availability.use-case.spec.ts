import { NotFoundException } from '@nestjs/common';
import { UpdateAvailabilityUseCase } from './update-availability.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';

describe('UpdateAvailabilityUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'update'>
  > = {
    update: jest.fn(),
  };

  const useCase = new UpdateAvailabilityUseCase(collaboratorRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates availability fields', async () => {
    collaboratorRepository.update.mockResolvedValue(
      new CollaboratorEntity('1', null, 'PARCIAL', '5-10', 'Presencial'),
    );

    const result = await useCase.execute('1', {
      availabilityStatus: 'PARCIAL',
      weeklyHours: '5-10',
      modality: 'Presencial',
    });

    expect(collaboratorRepository.update).toHaveBeenCalledWith('1', {
      availabilityStatus: 'PARCIAL',
      weeklyHours: '5-10',
      modality: 'Presencial',
    });
    expect(result.availabilityStatus).toBe('PARCIAL');
  });

  it('throws NotFoundException when collaborator is missing', async () => {
    collaboratorRepository.update.mockResolvedValue(null);

    await expect(
      useCase.execute('99', { availabilityStatus: 'DISPONIBLE' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
