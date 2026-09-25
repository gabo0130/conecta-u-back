import { NotFoundException } from '@nestjs/common';
import { GetMeUseCase } from './get-me.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';

describe('GetMeUseCase', () => {
  const userRepository: jest.Mocked<Pick<UserRepository, 'findById'>> = {
    findById: jest.fn(),
  };

  const useCase = new GetMeUseCase(userRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns current user', async () => {
    userRepository.findById.mockResolvedValue(
      new UserEntity('1', 'Juan', 'juan@example.com', 'hashed', 'COLABORADOR'),
    );

    const result = await useCase.execute('1');

    expect(result).toEqual({
      id: '1',
      fullName: 'Juan',
      email: 'juan@example.com',
      role: 'COLABORADOR',
      menu: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'dashboard',
          path: '/dashboard',
          description: 'Resumen general',
          isActive: true,
        },
        {
          id: 'perfil',
          label: 'Mi perfil',
          icon: 'user',
          path: '/perfil',
        },
      ],
    });
  });

  it('throws NotFoundException when user is missing', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('99')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
