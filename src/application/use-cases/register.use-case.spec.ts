import { ConflictException } from '@nestjs/common';
import { RegisterUseCase } from './register.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { UserEntity } from '../../domain/entities/user.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { PasswordHasher } from '../../domain/repositories/password-hasher.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';

describe('RegisterUseCase', () => {
  const userRepository: jest.Mocked<
    Pick<UserRepository, 'findByEmail' | 'create'>
  > = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByEmail' | 'create' | 'update'>
  > = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const passwordHasher: jest.Mocked<Pick<PasswordHasher, 'hash'>> = {
    hash: jest.fn(),
  };

  const useCase = new RegisterUseCase(
    userRepository,
    collaboratorRepository,
    passwordHasher,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a LIDER without touching the collaborator repository', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed');
    userRepository.create.mockResolvedValue(
      new UserEntity('1', 'Laura', 'laura@example.com', 'hashed', 'LIDER'),
    );

    const result = await useCase.execute({
      fullName: 'Laura',
      email: ' LAURA@EXAMPLE.COM ',
      password: 'Secret123*',
      role: 'LIDER',
    });

    expect(collaboratorRepository.findByEmail).not.toHaveBeenCalled();
    expect(collaboratorRepository.create).not.toHaveBeenCalled();
    expect(result.role).toBe('LIDER');
  });

  it('creates a new collaborator when registering as COLABORADOR with no existing record', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    collaboratorRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed');
    userRepository.create.mockResolvedValue(
      new UserEntity('2', 'Ana', 'ana@example.com', 'hashed', 'COLABORADOR'),
    );

    await useCase.execute({
      fullName: 'Ana',
      email: 'ana@example.com',
      password: 'Secret123*',
      role: 'COLABORADOR',
      collaborator: {
        firstName: 'Ana',
        lastName: 'Gómez',
        personType: 'ESTUDIANTE',
        programId: 'prog-1',
      },
    });

    expect(collaboratorRepository.create).toHaveBeenCalledWith({
      email: 'ana@example.com',
      userId: '2',
      firstName: 'Ana',
      lastName: 'Gómez',
      personType: 'ESTUDIANTE',
      programId: 'prog-1',
      source: 'REGISTRO',
    });
  });

  it('links to an existing unlinked collaborator by email', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    collaboratorRepository.findByEmail.mockResolvedValue(
      new CollaboratorEntity(
        'c1',
        'ana@example.com',
        null,
        'Ana',
        'Gómez',
        'ESTUDIANTE',
        'prog-1',
      ),
    );
    passwordHasher.hash.mockResolvedValue('hashed');
    userRepository.create.mockResolvedValue(
      new UserEntity('2', 'Ana', 'ana@example.com', 'hashed', 'COLABORADOR'),
    );

    await useCase.execute({
      fullName: 'Ana',
      email: 'ana@example.com',
      password: 'Secret123*',
      role: 'COLABORADOR',
      collaborator: {
        firstName: 'Ana',
        lastName: 'Gómez',
        personType: 'ESTUDIANTE',
        programId: 'prog-1',
      },
    });

    expect(collaboratorRepository.create).not.toHaveBeenCalled();
    expect(collaboratorRepository.update).toHaveBeenCalledWith('c1', {
      userId: '2',
    });
  });

  it('throws ConflictException when the email is already registered', async () => {
    userRepository.findByEmail.mockResolvedValue(
      new UserEntity('9', 'X', 'ana@example.com', 'hashed', 'COLABORADOR'),
    );

    await expect(
      useCase.execute({
        fullName: 'Ana',
        email: 'ana@example.com',
        password: 'Secret123*',
        role: 'COLABORADOR',
        collaborator: {
          firstName: 'Ana',
          lastName: 'Gómez',
          personType: 'ESTUDIANTE',
          programId: 'prog-1',
        },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws ConflictException when the collaborator email is already linked to another account', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    collaboratorRepository.findByEmail.mockResolvedValue(
      new CollaboratorEntity(
        'c1',
        'ana@example.com',
        'other-user',
        'Ana',
        'Gómez',
        'ESTUDIANTE',
        'prog-1',
      ),
    );

    await expect(
      useCase.execute({
        fullName: 'Ana',
        email: 'ana@example.com',
        password: 'Secret123*',
        role: 'COLABORADOR',
        collaborator: {
          firstName: 'Ana',
          lastName: 'Gómez',
          personType: 'ESTUDIANTE',
          programId: 'prog-1',
        },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
