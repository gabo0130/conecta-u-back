import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import {
  IDENTITY,
  buildCollaborator,
  createMock,
} from '../../testing/test-doubles.testing';
import type { AdminGetCollaboratorUseCase } from './admin-get-collaborator.use-case';
import {
  AdminUpdateCollaboratorIdentificationUseCase,
  DOCUMENT_BELONGS_TO_OTHER,
} from './admin-update-collaborator-identification.use-case';

describe('AdminUpdateCollaboratorIdentificationUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const getCollaborator = createMock<AdminGetCollaboratorUseCase>();
  const useCase = new AdminUpdateCollaboratorIdentificationUseCase(
    collaboratorRepository,
    getCollaborator,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findById.mockResolvedValue(
      buildCollaborator({ id: 'c1', ...IDENTITY }),
    );
    collaboratorRepository.findByDocument.mockResolvedValue(null);
  });

  it('completes the identification of a person imported before v2.1 and returns the detail', async () => {
    collaboratorRepository.findById.mockResolvedValue(
      buildCollaborator({ id: 'c1' }),
    );

    await useCase.execute('c1', IDENTITY);

    expect(collaboratorRepository.update).toHaveBeenCalledWith('c1', IDENTITY);
    expect(getCollaborator.execute).toHaveBeenCalledWith('c1');
  });

  it('validates a new number against the stored document type', async () => {
    collaboratorRepository.findById.mockResolvedValue(
      buildCollaborator({ id: 'c1', ...IDENTITY, documentType: 'CE' }),
    );

    await expect(
      useCase.execute('c1', { documentNumber: 'AB123' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(collaboratorRepository.update).not.toHaveBeenCalled();
  });

  it('422 when changing the document of a person that never had one without its type', async () => {
    collaboratorRepository.findById.mockResolvedValue(
      buildCollaborator({ id: 'c1' }),
    );

    await expect(
      useCase.execute('c1', { documentNumber: '1090123456' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('409 when the document belongs to another person', async () => {
    collaboratorRepository.findByDocument.mockResolvedValue(
      buildCollaborator({ id: 'other' }),
    );

    await expect(
      useCase.execute('c1', { documentNumber: '1090123456' }),
    ).rejects.toMatchObject(
      new ConflictException({ message: DOCUMENT_BELONGS_TO_OTHER }),
    );
  });

  it('allows saving the same document again (it is already hers)', async () => {
    collaboratorRepository.findByDocument.mockResolvedValue(
      buildCollaborator({ id: 'c1' }),
    );

    await useCase.execute('c1', { ...IDENTITY });

    expect(collaboratorRepository.update).toHaveBeenCalled();
  });

  it('422 when the alternate email is the main one', async () => {
    await expect(
      useCase.execute('c1', { alternateEmail: 'ana@example.com' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('404 for an unknown person', async () => {
    collaboratorRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
