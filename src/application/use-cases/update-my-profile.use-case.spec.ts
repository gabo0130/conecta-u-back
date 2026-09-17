import { NotFoundException } from '@nestjs/common';
import { UpdateMyProfileUseCase } from './update-my-profile.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';

describe('UpdateMyProfileUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'update'>
  > = {
    update: jest.fn(),
  };

  const useCase = new UpdateMyProfileUseCase(collaboratorRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the headline', async () => {
    collaboratorRepository.update.mockResolvedValue(
      new CollaboratorEntity('1', 'New headline', 'DISPONIBLE', null, null),
    );

    const result = await useCase.execute('1', { headline: 'New headline' });

    expect(collaboratorRepository.update).toHaveBeenCalledWith('1', {
      headline: 'New headline',
    });
    expect(result.headline).toBe('New headline');
  });

  it('throws NotFoundException when collaborator is missing', async () => {
    collaboratorRepository.update.mockResolvedValue(null);

    await expect(
      useCase.execute('99', { headline: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
