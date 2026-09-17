import { NotFoundException } from '@nestjs/common';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';

describe('GetUserByIdUseCase', () => {
  const userRepository: jest.Mocked<Pick<UserRepository, 'findById'>> = {
    findById: jest.fn(),
  };

  const useCase = new GetUserByIdUseCase(userRepository);

  it('returns user when found', async () => {
    userRepository.findById.mockResolvedValue(
      new UserEntity('4', 'Luz', 'luz@example.com', 'x', 'LIDER'),
    );

    await expect(useCase.execute('4')).resolves.toEqual({
      id: '4',
      fullName: 'Luz',
      email: 'luz@example.com',
      role: 'LIDER',
      program: null,
    });
  });

  it('throws NotFoundException when missing', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('4')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
