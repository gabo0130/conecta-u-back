import { NotFoundException } from '@nestjs/common';
import { UpdateMyCollaboratorProfileUseCase } from './update-my-collaborator-profile.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import {
  buildCollaborator,
  buildProgram,
  createMock,
} from '../../testing/test-doubles.testing';

describe('UpdateMyCollaboratorProfileUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const programRepository = createMock<ProgramRepository>();
  const useCase = new UpdateMyCollaboratorProfileUseCase(
    collaboratorRepository,
    programRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByUserId.mockResolvedValue(buildCollaborator());
    collaboratorRepository.update.mockResolvedValue(
      buildCollaborator({ summary: 'Nuevo resumen' }),
    );
    programRepository.findById.mockResolvedValue(buildProgram());
  });

  it('updates only the fields sent and returns the full profile', async () => {
    const result = await useCase.execute('user-1', {
      summary: 'Nuevo resumen',
    });

    expect(collaboratorRepository.update).toHaveBeenCalledWith('collab-1', {
      summary: 'Nuevo resumen',
    });
    expect(result).toEqual(
      expect.objectContaining({ summary: 'Nuevo resumen', skills: [] }),
    );
  });

  it('stores the consent date when consent is granted and clears it when revoked', async () => {
    await useCase.execute('user-1', { dataConsent: true });
    expect(collaboratorRepository.update).toHaveBeenLastCalledWith('collab-1', {
      dataConsent: true,
      dataConsentAt: expect.any(Date),
    });

    await useCase.execute('user-1', { dataConsent: false });
    expect(collaboratorRepository.update).toHaveBeenLastCalledWith('collab-1', {
      dataConsent: false,
      dataConsentAt: null,
    });
  });

  it('validates a new program before updating', async () => {
    programRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', { programId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(collaboratorRepository.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the user has no profile', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', { summary: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when the profile disappears while updating', async () => {
    collaboratorRepository.update.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', { summary: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
