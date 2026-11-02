import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import {
  buildCollaborator,
  buildProgram,
  createMock,
} from '../../testing/test-doubles.testing';
import type { AdminCreatePersonDto } from '../dto/admin-person.dto';
import { AdminCreatePersonUseCase } from './admin-create-person.use-case';
import type { AdminGetCollaboratorUseCase } from './admin-get-collaborator.use-case';
import { AdminUpdatePersonUseCase } from './admin-update-person.use-case';

describe('RF17 person management', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const programRepository = createMock<ProgramRepository>();
  const getCollaborator = createMock<AdminGetCollaboratorUseCase>();
  const create = new AdminCreatePersonUseCase(
    collaboratorRepository,
    programRepository,
    getCollaborator,
  );
  const update = new AdminUpdatePersonUseCase(
    collaboratorRepository,
    programRepository,
    getCollaborator,
  );
  const dto: AdminCreatePersonDto = {
    email: 'docente@ufps.edu.co',
    firstName: 'Marta',
    lastName: 'Rojas',
    personType: 'DOCENTE',
    programId: 'program-1',
    documentType: 'CC',
    documentNumber: '88123456',
    phone: '3001234567',
    nationality: 'Colombiana',
    dataConsent: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByEmail.mockResolvedValue(null);
    collaboratorRepository.findByDocument.mockResolvedValue(null);
    collaboratorRepository.findById.mockResolvedValue(buildCollaborator());
    collaboratorRepository.create.mockResolvedValue(
      buildCollaborator({ id: 'new-1', userId: null }),
    );
    programRepository.findById.mockResolvedValue(buildProgram());
    getCollaborator.execute.mockResolvedValue({ id: 'detail' } as never);
  });

  it('creates a person without account, with ADMIN source and consent date', async () => {
    await expect(create.execute(dto)).resolves.toEqual({ id: 'detail' });

    const [data] = collaboratorRepository.create.mock.calls[0];
    expect(data).toMatchObject({
      email: 'docente@ufps.edu.co',
      userId: null,
      source: 'ADMIN',
      dataConsent: true,
      documentNumber: '88123456',
    });
    expect(data.dataConsentAt).toBeInstanceOf(Date);
    expect(getCollaborator.execute).toHaveBeenCalledWith('new-1');
  });

  it('rejects duplicated email or document and same alternate email', async () => {
    collaboratorRepository.findByEmail.mockResolvedValueOnce(
      buildCollaborator(),
    );
    await expect(create.execute(dto)).rejects.toBeInstanceOf(ConflictException);

    collaboratorRepository.findByDocument.mockResolvedValueOnce(
      buildCollaborator(),
    );
    await expect(create.execute(dto)).rejects.toBeInstanceOf(ConflictException);

    await expect(
      create.execute({ ...dto, alternateEmail: 'DOCENTE@ufps.edu.co' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(collaboratorRepository.create).not.toHaveBeenCalled();
  });

  it('updates only the fields sent and validates the program', async () => {
    await update.updateProfile('collab-1', {
      summary: 'Docente de redes',
      programId: 'program-2',
      semester: undefined,
    });

    expect(programRepository.findById).toHaveBeenCalledWith('program-2');
    expect(collaboratorRepository.update).toHaveBeenCalledWith('collab-1', {
      summary: 'Docente de redes',
      programId: 'program-2',
    });
  });

  it('deactivates and reactivates a person', async () => {
    await update.setStatus('collab-1', { active: false });
    expect(collaboratorRepository.update).toHaveBeenCalledWith('collab-1', {
      active: false,
    });
  });

  it('returns 404 for an unknown person', async () => {
    collaboratorRepository.findById.mockResolvedValue(null);
    await expect(
      update.setStatus('nobody', { active: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(collaboratorRepository.update).not.toHaveBeenCalled();
  });
});
