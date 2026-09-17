import { NotFoundException } from '@nestjs/common';
import { DeleteUserUseCase } from './delete-user.use-case';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';

describe('DeleteUserUseCase', () => {
  const userRepository: jest.Mocked<Pick<UserRepository, 'delete'>> = {
    delete: jest.fn(),
  };

  const useCase = new DeleteUserUseCase(userRepository);

  it('completes when user is deleted', async () => {
    userRepository.delete.mockResolvedValue(true);

    await expect(useCase.execute(8)).resolves.toBeUndefined();
  });

  it('throws NotFoundException when delete returns false', async () => {
    userRepository.delete.mockResolvedValue(false);

    await expect(useCase.execute(8)).rejects.toBeInstanceOf(NotFoundException);
  });
});
