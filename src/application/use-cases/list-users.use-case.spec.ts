import { ListUsersUseCase } from './list-users.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';

describe('ListUsersUseCase', () => {
  const userRepository: jest.Mocked<Pick<UserRepository, 'findAll'>> = {
    findAll: jest.fn(),
  };

  const useCase = new ListUsersUseCase(userRepository);

  it('returns mapped users list', async () => {
    userRepository.findAll.mockResolvedValue([
      new UserEntity('1', 'A', 'a@example.com', 'x', 'ADMIN'),
      new UserEntity('2', 'B', 'b@example.com', 'x', 'COLABORADOR'),
    ]);

    const result = await useCase.execute();

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
    });
  });
});
