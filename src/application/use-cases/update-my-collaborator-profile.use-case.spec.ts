import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UpdateMyCollaboratorProfileUseCase } from './update-my-collaborator-profile.use-case';
import type { UpdateCollaboratorDto } from '../dto/update-collaborator.dto';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import {
  IDENTITY,
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

  // v2.2, E2: «Mi perfil» siempre manda la declaración de veracidad.
  const update = (data: Omit<UpdateCollaboratorDto, 'truthfulnessDeclared'>) =>
    useCase.execute('user-1', { ...data, truthfulnessDeclared: true });
  const DECLARED = {
    truthfulnessDeclared: true,
    truthfulnessDeclaredAt: expect.any(Date) as Date,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByUserId.mockResolvedValue(buildCollaborator());
    collaboratorRepository.update.mockResolvedValue(
      buildCollaborator({ summary: 'Nuevo resumen' }),
    );
    programRepository.findById.mockResolvedValue(buildProgram());
  });

  it('updates only the fields sent and returns the full profile', async () => {
    const result = await update({
      summary: 'Nuevo resumen',
    });

    expect(collaboratorRepository.update).toHaveBeenCalledWith('collab-1', {
      summary: 'Nuevo resumen',
      ...DECLARED,
    });
    expect(result).toEqual(
      expect.objectContaining({ summary: 'Nuevo resumen', skills: [] }),
    );
  });

  it('stores the consent date when consent is granted and clears it when revoked', async () => {
    await update({ dataConsent: true });
    expect(collaboratorRepository.update).toHaveBeenLastCalledWith('collab-1', {
      dataConsent: true,
      dataConsentAt: expect.any(Date),
      ...DECLARED,
    });

    await update({ dataConsent: false });
    expect(collaboratorRepository.update).toHaveBeenLastCalledWith('collab-1', {
      dataConsent: false,
      dataConsentAt: null,
      ...DECLARED,
    });
  });

  it('validates a new program before updating', async () => {
    programRepository.findById.mockResolvedValue(null);

    await expect(update({ programId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(collaboratorRepository.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the user has no profile', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(update({ summary: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException when the profile disappears while updating', async () => {
    collaboratorRepository.update.mockResolvedValue(null);

    await expect(update({ summary: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('documento y contacto (v2.1)', () => {
    it('lets a person without document complete it once, with contact data', async () => {
      collaboratorRepository.findByDocument.mockResolvedValue(null);

      await update({ ...IDENTITY });

      expect(collaboratorRepository.update).toHaveBeenCalledWith('collab-1', {
        ...IDENTITY,
        ...DECLARED,
      });
    });

    it('403 when the person tries to change a document already saved', async () => {
      collaboratorRepository.findByUserId.mockResolvedValue(
        buildCollaborator({ ...IDENTITY }),
      );
      collaboratorRepository.findByDocument.mockResolvedValue(null);

      await expect(
        update({ documentNumber: '1090123456' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(collaboratorRepository.update).not.toHaveBeenCalled();
    });

    it('accepts the same saved document (nothing changes)', async () => {
      collaboratorRepository.findByUserId.mockResolvedValue(
        buildCollaborator({ ...IDENTITY }),
      );
      collaboratorRepository.findByDocument.mockResolvedValue(
        buildCollaborator({ ...IDENTITY }),
      );

      await update({ ...IDENTITY, phone: '3011112233' });

      expect(collaboratorRepository.update).toHaveBeenCalled();
    });

    it('409 when the document belongs to someone else', async () => {
      collaboratorRepository.findByDocument.mockResolvedValue(
        buildCollaborator({ id: 'other' }),
      );

      await expect(update({ ...IDENTITY })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('422 when the alternate email is the main one', async () => {
      await expect(
        update({ alternateEmail: 'ANA@example.com' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });
});
