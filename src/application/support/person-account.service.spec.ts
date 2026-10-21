import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import {
  IDENTITY,
  buildCollaborator,
  buildProgram,
  createMock,
} from '../../testing/test-doubles.testing';
import {
  DOCUMENT_TAKEN,
  DOCUMENT_WITH_OTHER_EMAIL,
  EMAIL_TAKEN,
  EMAIL_WITH_OTHER_DOCUMENT,
  type PersonForAccount,
  PersonAccountService,
} from './person-account.service';

describe('PersonAccountService (v2.1: toda cuenta queda vinculada a una persona)', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const programRepository = createMock<ProgramRepository>();
  const service = new PersonAccountService(
    collaboratorRepository,
    programRepository,
  );
  const repositories = { collaborators: collaboratorRepository };

  const person: PersonForAccount = {
    firstName: 'Ana',
    lastName: 'Pérez',
    personType: 'ESTUDIANTE',
    programId: 'program-1',
    ...IDENTITY,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByDocument.mockResolvedValue(null);
    collaboratorRepository.findByEmail.mockResolvedValue(null);
    programRepository.findById.mockResolvedValue(buildProgram());
    collaboratorRepository.create.mockResolvedValue(buildCollaborator());
    collaboratorRepository.update.mockResolvedValue(buildCollaborator());
  });

  it('creates the person with its identification when nobody has the document or email', async () => {
    const pending = await service.prepare('ana@example.com', person);
    await service.link(repositories, 'user-1', pending);

    expect(collaboratorRepository.findByDocument).toHaveBeenCalledWith(
      'CC',
      '9900000001',
    );
    expect(collaboratorRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@example.com',
        userId: 'user-1',
        documentType: 'CC',
        documentNumber: '9900000001',
        phone: '3000000001',
        nationality: 'Colombiana',
        alternateEmail: null,
        institutionalCode: null,
        source: 'REGISTRO',
      }),
    );
  });

  it('links an imported person found by document when the email matches', async () => {
    collaboratorRepository.findByDocument.mockResolvedValue(
      buildCollaborator({ id: 'imported-1', userId: null, ...IDENTITY }),
    );

    const pending = await service.prepare('ANA@example.com', {
      ...person,
      dataConsent: true,
    });
    await service.link(repositories, 'user-1', pending);

    expect(collaboratorRepository.update).toHaveBeenCalledWith(
      'imported-1',
      expect.objectContaining({
        userId: 'user-1',
        documentNumber: '9900000001',
        dataConsent: true,
        dataConsentAt: expect.any(Date) as Date,
      }),
    );
    expect(collaboratorRepository.create).not.toHaveBeenCalled();
    expect(programRepository.findById).not.toHaveBeenCalled();
  });

  it('does not touch the consent of a linked person when it is not sent', async () => {
    collaboratorRepository.findByEmail.mockResolvedValue(
      buildCollaborator({ id: 'imported-1', userId: null }),
    );

    const pending = await service.prepare('ana@example.com', person);
    await service.link(repositories, 'user-1', pending);

    const [, data] = collaboratorRepository.update.mock.calls[0];
    expect(data).not.toHaveProperty('dataConsent');
  });

  it('links a person found by email that has no document yet and completes it', async () => {
    collaboratorRepository.findByEmail.mockResolvedValue(
      buildCollaborator({ id: 'old-1', userId: null }),
    );

    const pending = await service.prepare('ana@example.com', person);
    await service.link(repositories, 'user-1', pending);

    expect(collaboratorRepository.update).toHaveBeenCalledWith(
      'old-1',
      expect.objectContaining({
        userId: 'user-1',
        documentNumber: '9900000001',
      }),
    );
  });

  it.each([
    [
      'the document already has an account',
      () =>
        collaboratorRepository.findByDocument.mockResolvedValue(
          buildCollaborator({ userId: 'other-user' }),
        ),
      DOCUMENT_TAKEN,
    ],
    [
      'the document belongs to a person with another email',
      () =>
        collaboratorRepository.findByDocument.mockResolvedValue(
          buildCollaborator({ userId: null, email: 'otra@example.com' }),
        ),
      DOCUMENT_WITH_OTHER_EMAIL,
    ],
    [
      'the email already has an account',
      () =>
        collaboratorRepository.findByEmail.mockResolvedValue(
          buildCollaborator({ userId: 'other-user' }),
        ),
      EMAIL_TAKEN,
    ],
    [
      'the email belongs to a person with another document',
      () =>
        collaboratorRepository.findByEmail.mockResolvedValue(
          buildCollaborator({ userId: null, documentNumber: '1234567' }),
        ),
      EMAIL_WITH_OTHER_DOCUMENT,
    ],
  ])('409 when %s', async (_case, arrange, message) => {
    arrange();

    await expect(
      service.prepare('ana@example.com', person),
    ).rejects.toMatchObject(new ConflictException({ message }));
  });

  it('422 when the alternate email is the main one', async () => {
    await expect(
      service.prepare('ana@example.com', {
        ...person,
        alternateEmail: 'Ana@Example.com',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('404 for a program that does not exist, before writing anything', async () => {
    programRepository.findById.mockResolvedValue(null);

    await expect(
      service.prepare('ana@example.com', person),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(collaboratorRepository.create).not.toHaveBeenCalled();
  });
});
