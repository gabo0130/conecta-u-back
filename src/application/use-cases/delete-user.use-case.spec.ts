import { NotFoundException } from '@nestjs/common';
import { DeleteUserUseCase } from './delete-user.use-case';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { createMock } from '../../testing/test-doubles.testing';

describe('DeleteUserUseCase', () => {
  const userRepository = createMock<UserRepository>();

  const useCase = new DeleteUserUseCase(userRepository);

  it('completes when user is deleted', async () => {
    userRepository.delete.mockResolvedValue(true);

    await expect(useCase.execute('8')).resolves.toBeUndefined();
  });

  it('throws NotFoundException when delete returns false', async () => {
    userRepository.delete.mockResolvedValue(false);

    await expect(useCase.execute('8')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
