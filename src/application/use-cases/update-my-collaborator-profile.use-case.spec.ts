import { NotFoundException } from '@nestjs/common';
import { UpdateMyCollaboratorProfileUseCase } from './update-my-collaborator-profile.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';

function buildCollaborator(
  overrides: Partial<{ id: string; userId: string | null }> = {},
) {
  return new CollaboratorEntity(
    overrides.id ?? 'c1',
    'ana@example.com',
    overrides.userId ?? 'u1',
    'Ana',
    'Gómez',
    'ESTUDIANTE',
    'prog-1',
  );
}

describe('UpdateMyCollaboratorProfileUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByUserId' | 'update'>
  > = {
    findByUserId: jest.fn(),
    update: jest.fn(),
  };

  const useCase = new UpdateMyCollaboratorProfileUseCase(
    collaboratorRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the collaborator profile', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(buildCollaborator());
    collaboratorRepository.update.mockResolvedValue(
      new CollaboratorEntity(
        'c1',
        'ana@example.com',
        'u1',
        'Ana',
        'Gómez actualizado',
        'ESTUDIANTE',
        'prog-1',
      ),
    );

    const result = await useCase.execute('u1', {
      lastName: 'Gómez actualizado',
    });

    expect(collaboratorRepository.update).toHaveBeenCalledWith('c1', {
      lastName: 'Gómez actualizado',
    });
    expect(result.lastName).toBe('Gómez actualizado');
  });

  it('stamps dataConsentAt when dataConsent changes', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(buildCollaborator());
    collaboratorRepository.update.mockResolvedValue(buildCollaborator());

    await useCase.execute('u1', { dataConsent: true });

    expect(collaboratorRepository.update).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        dataConsent: true,
        dataConsentAt: expect.any(Date),
      }),
    );
  });

  it('throws NotFoundException when the profile does not exist', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(
      useCase.execute('u1', { lastName: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
