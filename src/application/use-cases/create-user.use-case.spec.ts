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
import type { CreateUserDto } from '../dto/create-user.dto';
import { PersonAccountService } from '../support/person-account.service';
import { CreateUserUseCase } from './create-user.use-case';
import type { SendWelcomeEmailUseCase } from './send-welcome-email.use-case';

describe('CreateUserUseCase', () => {
  const userRepository = createMock<UserRepository>();
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const programRepository = createMock<ProgramRepository>();
  const passwordHasher = createMock<PasswordHasher>();
  const { unitOfWork, repositories } = createFakeUnitOfWork();
  const sendWelcomeEmail = createMock<SendWelcomeEmailUseCase>();

  const useCase = new CreateUserUseCase(
    userRepository,
    passwordHasher,
    unitOfWork,
    new PersonAccountService(collaboratorRepository, programRepository),
    sendWelcomeEmail,
  );

  const dto: CreateUserDto = {
    fullName: 'Ana',
    email: ' ANA@EXAMPLE.COM ',
    password: 'Secret123*',
    role: 'ADMIN',
    collaborator: {
      firstName: 'Ana',
      lastName: 'Pérez',
      personType: 'DOCENTE',
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
    repositories.users.create.mockResolvedValue(
      buildUser({ id: 'u-2', email: 'ana@example.com', role: 'ADMIN' }),
    );
    repositories.collaborators.create.mockResolvedValue(buildCollaborator());
  });

  it('creates the account with any role and links it to a person in one transaction', async () => {
    const result = await useCase.execute(dto);

    expect(unitOfWork.run).toHaveBeenCalledTimes(1);
    expect(repositories.users.create).toHaveBeenCalledWith({
      fullName: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'hashed',
      role: 'ADMIN',
    });
    expect(repositories.collaborators.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u-2', documentNumber: '9900000001' }),
    );
    expect(result.role).toBe('ADMIN');
    expect(sendWelcomeEmail.execute).toHaveBeenCalled();
  });

  it('throws ConflictException when email is already used', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser());

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(unitOfWork.run).not.toHaveBeenCalled();
    expect(sendWelcomeEmail.execute).not.toHaveBeenCalled();
  });

  it('throws ConflictException when the document already has an account', async () => {
    collaboratorRepository.findByDocument.mockResolvedValue(
      buildCollaborator({ userId: 'other' }),
    );

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(unitOfWork.run).not.toHaveBeenCalled();
  });
});
