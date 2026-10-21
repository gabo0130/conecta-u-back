import { ConflictException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { PasswordHasher } from '../../domain/repositories/password-hasher.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  IDENTITY,
  buildCollaborator,
  buildProgram,
  buildUser,
  createFakeUnitOfWork,
  createMock,
} from '../../testing/test-doubles.testing';
import type { RegisterDto } from '../dto/register.dto';
import { PersonAccountService } from '../support/person-account.service';
import { RegisterUseCase } from './register.use-case';
import type { SendWelcomeEmailUseCase } from './send-welcome-email.use-case';

// Las reglas de vínculo cuenta–persona se prueban en person-account.service.spec.ts.
describe('RegisterUseCase', () => {
  const userRepository = createMock<UserRepository>();
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const programRepository = createMock<ProgramRepository>();
  const passwordHasher = createMock<PasswordHasher>();
  const { unitOfWork, repositories } = createFakeUnitOfWork();
  const sendWelcomeEmail = createMock<SendWelcomeEmailUseCase>();

  const useCase = new RegisterUseCase(
    userRepository,
    passwordHasher,
    unitOfWork,
    new PersonAccountService(collaboratorRepository, programRepository),
    sendWelcomeEmail,
  );

  const colaborador: RegisterDto = {
    fullName: 'Ana Pérez',
    email: ' ANA@EXAMPLE.COM ',
    password: 'Secret123*',
    role: 'COLABORADOR',
    collaborator: {
      firstName: 'Ana',
      lastName: 'Pérez',
      personType: 'ESTUDIANTE',
      programId: 'program-1',
      ...IDENTITY,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findByEmail.mockResolvedValue(null);
    collaboratorRepository.findByEmail.mockResolvedValue(null);
    collaboratorRepository.findByDocument.mockResolvedValue(null);
    programRepository.findById.mockResolvedValue(buildProgram());
    passwordHasher.hash.mockResolvedValue('hashed');
    repositories.users.create.mockResolvedValue(buildUser());
    repositories.collaborators.create.mockResolvedValue(buildCollaborator());
  });

  it('creates user and person inside the same unit of work', async () => {
    await useCase.execute(colaborador);

    expect(unitOfWork.run).toHaveBeenCalledTimes(1);
    expect(repositories.users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@example.com',
        role: 'COLABORADOR',
      }),
    );
    expect(repositories.collaborators.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@example.com',
        userId: 'user-1',
        documentNumber: '9900000001',
      }),
    );
  });

  it('also links a LIDER to a person (v2.1)', async () => {
    repositories.users.create.mockResolvedValue(buildUser({ role: 'LIDER' }));

    const result = await useCase.execute({ ...colaborador, role: 'LIDER' });

    expect(result.role).toBe('LIDER');
    expect(repositories.collaborators.create).toHaveBeenCalledTimes(1);
  });

  it('sends the welcome email once the account is created', async () => {
    repositories.users.create.mockResolvedValue(
      buildUser({
        fullName: 'Ana Pérez',
        email: 'ana@example.com',
        role: 'COLABORADOR',
      }),
    );

    await useCase.execute(colaborador);

    expect(sendWelcomeEmail.execute).toHaveBeenCalledWith({
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      role: 'COLABORADOR',
    });
  });

  it('rejects an email that already has an account, without writing or emailing', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser());

    await expect(useCase.execute(colaborador)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(unitOfWork.run).not.toHaveBeenCalled();
    expect(sendWelcomeEmail.execute).not.toHaveBeenCalled();
  });

  it('rejects a document that already has an account before writing anything', async () => {
    collaboratorRepository.findByDocument.mockResolvedValue(
      buildCollaborator({ userId: 'other-user' }),
    );

    await expect(useCase.execute(colaborador)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(unitOfWork.run).not.toHaveBeenCalled();
  });

  it('propagates a failure of the transaction without returning a user', async () => {
    repositories.collaborators.create.mockRejectedValue(new Error('db down'));

    await expect(useCase.execute(colaborador)).rejects.toThrow('db down');
  });
});
