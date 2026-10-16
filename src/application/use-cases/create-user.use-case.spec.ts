import { ConflictException } from '@nestjs/common';
import { CreateUserUseCase } from './create-user.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import type { PasswordHasher } from '../../domain/repositories/password-hasher.interface';
import { createMock } from '../../testing/test-doubles.testing';
import type { SendWelcomeEmailUseCase } from './send-welcome-email.use-case';

describe('CreateUserUseCase', () => {
  const userRepository = createMock<UserRepository>();

  const passwordHasher = createMock<PasswordHasher>();
  const sendWelcomeEmail = createMock<SendWelcomeEmailUseCase>();

  const useCase = new CreateUserUseCase(
    userRepository,
    passwordHasher,
    sendWelcomeEmail,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates user when email is available', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed');
    userRepository.create.mockResolvedValue(
      new UserEntity('2', 'Ana', 'ana@example.com', 'hashed', 'COLABORADOR'),
    );

    const result = await useCase.execute({
      fullName: 'Ana',
      email: ' ANA@EXAMPLE.COM ',
      password: 'Secret123*',
      role: 'COLABORADOR',
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('ana@example.com');
    expect(passwordHasher.hash).toHaveBeenCalledWith('Secret123*');
    expect(userRepository.create).toHaveBeenCalledWith({
      fullName: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'hashed',
      role: 'COLABORADOR',
    });
    expect(result.role).toBe('COLABORADOR');
    expect(sendWelcomeEmail.execute).toHaveBeenCalledWith({
      fullName: 'Ana',
      email: 'ana@example.com',
      role: 'COLABORADOR',
    });
  });

  it('throws ConflictException when email is already used', async () => {
    userRepository.findByEmail.mockResolvedValue(
      new UserEntity('10', 'Existing', 'existing@example.com', 'x', 'LIDER'),
    );

    await expect(
      useCase.execute({
        fullName: 'Ana',
        email: 'existing@example.com',
        password: 'Secret123*',
        role: 'LIDER',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(sendWelcomeEmail.execute).not.toHaveBeenCalled();
  });
});
