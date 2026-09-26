import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateUserUseCase } from './update-user.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { createMock } from '../../testing/test-doubles.testing';

describe('UpdateUserUseCase', () => {
  const userRepository = createMock<UserRepository>();

  const useCase = new UpdateUserUseCase(userRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates user when it exists', async () => {
    userRepository.findById.mockResolvedValue(
      new UserEntity('1', 'Ana', 'ana@example.com', 'hashed', 'COLABORADOR'),
    );
    userRepository.update.mockResolvedValue(
      new UserEntity(
        '1',
        'Ana Updated',
        'ana@example.com',
        'hashed',
        'COLABORADOR',
      ),
    );

    const result = await useCase.execute('1', { fullName: 'Ana Updated' });

    expect(userRepository.update).toHaveBeenCalledWith('1', {
      fullName: 'Ana Updated',
    });
    expect(result.fullName).toBe('Ana Updated');
  });

  it('throws NotFoundException when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('99', { fullName: 'Ana' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ConflictException when new email is already taken', async () => {
    userRepository.findById.mockResolvedValue(
      new UserEntity('1', 'Ana', 'ana@example.com', 'hashed', 'COLABORADOR'),
    );
    userRepository.findByEmail.mockResolvedValue(
      new UserEntity('2', 'Otro', 'otro@example.com', 'hashed', 'COLABORADOR'),
    );

    await expect(
      useCase.execute('1', { email: 'otro@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
