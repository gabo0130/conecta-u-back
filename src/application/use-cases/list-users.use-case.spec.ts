import { ListUsersUseCase } from './list-users.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { createMock } from '../../testing/test-doubles.testing';

describe('ListUsersUseCase', () => {
  const userRepository = createMock<UserRepository>();

  const useCase = new ListUsersUseCase(userRepository);

  it('returns mapped users list with pagination meta', async () => {
    userRepository.findAll.mockResolvedValue({
      items: [
        new UserEntity('1', 'A', 'a@example.com', 'x', 'ADMIN'),
        new UserEntity('2', 'B', 'b@example.com', 'x', 'COLABORADOR'),
      ],
      total: 2,
    });

    const result = await useCase.execute({ page: 1, pageSize: 20 });

    expect(userRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
    });
    expect(result).toEqual({
      users: [
        {
          id: '1',
          fullName: 'A',
          email: 'a@example.com',
          role: 'ADMIN',
          active: true,
        },
        {
          id: '2',
          fullName: 'B',
          email: 'b@example.com',
          role: 'COLABORADOR',
          active: true,
        },
      ],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
  });
});
