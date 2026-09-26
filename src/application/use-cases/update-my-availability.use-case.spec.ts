import { NotFoundException } from '@nestjs/common';
import { UpdateMyAvailabilityUseCase } from './update-my-availability.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import {
  buildCollaborator,
  createMock,
} from '../../testing/test-doubles.testing';

describe('UpdateMyAvailabilityUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const useCase = new UpdateMyAvailabilityUseCase(collaboratorRepository);
  const dto = { availabilityStatus: 'PARCIAL' as const, weeklyHours: 10 };

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByUserId.mockResolvedValue(buildCollaborator());
  });

  it('updates availability status and weekly hours', async () => {
    collaboratorRepository.update.mockResolvedValue(
      buildCollaborator({ availabilityStatus: 'PARCIAL', weeklyHours: 10 }),
    );

    await expect(useCase.execute('user-1', dto)).resolves.toEqual(dto);
    expect(collaboratorRepository.update).toHaveBeenCalledWith('collab-1', dto);
  });

  it('throws NotFoundException when the user has no profile', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException when the profile disappears while updating', async () => {
    collaboratorRepository.update.mockResolvedValue(null);

    await expect(useCase.execute('user-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
