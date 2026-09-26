import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { RegisterUseCase } from './register.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { PasswordHasher } from '../../domain/repositories/password-hasher.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import type { RegisterDto } from '../dto/register.dto';
import {
  buildCollaborator,
  buildProgram,
  buildUser,
  createFakeUnitOfWork,
  createMock,
} from '../../testing/test-doubles.testing';

describe('RegisterUseCase', () => {
  const userRepository = createMock<UserRepository>();
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const programRepository = createMock<ProgramRepository>();
  const passwordHasher = createMock<PasswordHasher>();
  const { unitOfWork, repositories } = createFakeUnitOfWork();

  const useCase = new RegisterUseCase(
    userRepository,
    collaboratorRepository,
    programRepository,
    passwordHasher,
    unitOfWork,
  );

  const colaborador: RegisterDto = {
    fullName: 'Ana Pérez',
    email: ' ANA@EXAMPLE.COM ',
    password: 'Secret123*',
    role: 'COLABORADOR',
    collaborator: {
      firstName: ' Ana ',
      lastName: 'Pérez',
      personType: 'ESTUDIANTE',
      programId: 'program-1',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findByEmail.mockResolvedValue(null);
    collaboratorRepository.findByEmail.mockResolvedValue(null);
    programRepository.findById.mockResolvedValue(buildProgram());
    passwordHasher.hash.mockResolvedValue('hashed');
    repositories.users.create.mockResolvedValue(buildUser());
  });

  it('registers a LIDER without a collaborator profile', async () => {
    repositories.users.create.mockResolvedValue(buildUser({ role: 'LIDER' }));

    const result = await useCase.execute({
      fullName: 'Laura',
      email: 'laura@example.com',
      password: 'Secret123*',
      role: 'LIDER',
    });

    expect(result.role).toBe('LIDER');
    expect(collaboratorRepository.findByEmail).not.toHaveBeenCalled();
    expect(repositories.collaborators.create).not.toHaveBeenCalled();
  });

  it('creates user and collaborator inside the same unit of work', async () => {
    await useCase.execute(colaborador);

    expect(unitOfWork.run).toHaveBeenCalledTimes(1);
    expect(repositories.users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@example.com',
        role: 'COLABORADOR',
      }),
    );
    expect(repositories.collaborators.create).toHaveBeenCalledWith({
      email: 'ana@example.com',
      userId: 'user-1',
      firstName: 'Ana',
      lastName: 'Pérez',
      personType: 'ESTUDIANTE',
      programId: 'program-1',
      source: 'REGISTRO',
    });
  });

  it('links an imported collaborator that has no account yet', async () => {
    collaboratorRepository.findByEmail.mockResolvedValue(
      buildCollaborator({ id: 'imported-1', userId: null }),
    );

    await useCase.execute(colaborador);

    expect(repositories.collaborators.update).toHaveBeenCalledWith(
      'imported-1',
      { userId: 'user-1' },
    );
    expect(repositories.collaborators.create).not.toHaveBeenCalled();
    expect(programRepository.findById).not.toHaveBeenCalled();
  });

  it('rejects a program that does not exist before writing anything', async () => {
    programRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(colaborador)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(unitOfWork.run).not.toHaveBeenCalled();
  });

  it('rejects COLABORADOR without collaborator data', async () => {
    await expect(
      useCase.execute({ ...colaborador, collaborator: undefined }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(unitOfWork.run).not.toHaveBeenCalled();
  });

  it('rejects an email that already has an account', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser());

    await expect(useCase.execute(colaborador)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects a collaborator email already linked to another account', async () => {
    collaboratorRepository.findByEmail.mockResolvedValue(
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
