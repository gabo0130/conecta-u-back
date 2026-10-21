import { ConflictException, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  IDENTITY,
  buildCollaborator,
  buildProgram,
  buildUser,
  createMock,
} from '../../testing/test-doubles.testing';
import type { CreateMyCollaboratorDto } from '../dto/create-my-collaborator.dto';
import { PersonAccountService } from '../support/person-account.service';
import { CreateMyCollaboratorProfileUseCase } from './create-my-collaborator-profile.use-case';

describe('CreateMyCollaboratorProfileUseCase', () => {
  const userRepository = createMock<UserRepository>();
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const programRepository = createMock<ProgramRepository>();
  const useCase = new CreateMyCollaboratorProfileUseCase(
    userRepository,
    collaboratorRepository,
    new PersonAccountService(collaboratorRepository, programRepository),
  );

  const dto: CreateMyCollaboratorDto = {
    firstName: 'Mario',
    lastName: 'Quintero',
    personType: 'DOCENTE',
    programId: 'program-1',
    researchGroup: 'GIDIS',
    dataConsent: true,
    ...IDENTITY,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findById.mockResolvedValue(
      buildUser({ id: 'leader-1', email: 'mario@example.com', role: 'LIDER' }),
    );
    collaboratorRepository.findByUserId.mockResolvedValue(null);
    collaboratorRepository.findByEmail.mockResolvedValue(null);
    collaboratorRepository.findByDocument.mockResolvedValue(null);
    programRepository.findById.mockResolvedValue(buildProgram());
    collaboratorRepository.create.mockResolvedValue(
      buildCollaborator({ userId: 'leader-1' }),
    );
  });

  it('creates the profile with identification, profile fields and consent date', async () => {
    const result = await useCase.execute('leader-1', dto);

    expect(collaboratorRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'mario@example.com',
        userId: 'leader-1',
        firstName: 'Mario',
        researchGroup: 'GIDIS',
        documentNumber: '9900000001',
        dataConsent: true,
        dataConsentAt: expect.any(Date) as Date,
        source: 'REGISTRO',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'collab-1',
        skills: [],
        experiences: [],
        identificationComplete: false,
      }),
    );
  });

  it('links an imported person with the same email instead of duplicating it', async () => {
    collaboratorRepository.findByEmail.mockResolvedValue(
      buildCollaborator({ id: 'imported-1', userId: null }),
    );
    collaboratorRepository.update.mockResolvedValue(
      buildCollaborator({ id: 'imported-1', userId: 'leader-1' }),
    );

    const result = await useCase.execute('leader-1', dto);

    expect(collaboratorRepository.update).toHaveBeenCalledWith(
      'imported-1',
      expect.objectContaining({ userId: 'leader-1' }),
    );
    expect(collaboratorRepository.create).not.toHaveBeenCalled();
    expect(result.id).toBe('imported-1');
  });

  it('rejects a user that already has a profile', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(buildCollaborator());

    await expect(useCase.execute('leader-1', dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects an unknown user', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('fails when the linked person disappears while updating', async () => {
    collaboratorRepository.findByEmail.mockResolvedValue(
      buildCollaborator({ userId: null }),
    );
    collaboratorRepository.update.mockResolvedValue(null);

    await expect(useCase.execute('leader-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
