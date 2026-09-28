import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { UsersController } from './users.controller';
import type { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import type { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import type { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import type { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import type { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { createMock } from '../../testing/test-doubles.testing';

describe('UsersController', () => {
  const listUsersUseCase = createMock<ListUsersUseCase>();
  const getUserByIdUseCase = createMock<GetUserByIdUseCase>();
  const createUserUseCase = createMock<CreateUserUseCase>();
  const updateUserUseCase = createMock<UpdateUserUseCase>();
  const deleteUserUseCase = createMock<DeleteUserUseCase>();

  const controller = new UsersController(
    listUsersUseCase,
    getUserByIdUseCase,
    createUserUseCase,
    updateUserUseCase,
    deleteUserUseCase,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates list to use case', () => {
    const query = { page: 1, pageSize: 20 };
    listUsersUseCase.execute.mockResolvedValue({
      users: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });

    void expect(controller.list(query)).resolves.toEqual({
      users: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    expect(listUsersUseCase.execute).toHaveBeenCalledWith(query);
  });

  it('delegates getById to use case', () => {
    getUserByIdUseCase.execute.mockResolvedValue({
      id: '1',
      fullName: 'Ana',
      email: 'ana@example.com',
      role: 'COLABORADOR',
      active: true,
    });

    void controller.getById('1');

    expect(getUserByIdUseCase.execute).toHaveBeenCalledWith('1');
  });

  it('delegates create to use case', () => {
    const dto = {
      fullName: 'Ana',
      email: 'ana@example.com',
      password: 'Secret123*',
      role: 'COLABORADOR' as const,
    };

    void controller.create(dto);

    expect(createUserUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates update to use case', () => {
    const dto = { fullName: 'Ana Updated' };

    void controller.update('1', dto);

    expect(updateUserUseCase.execute).toHaveBeenCalledWith('1', dto);
  });

  it('delegates delete to use case', () => {
    void controller.delete(
      { user: { userId: 'admin', role: 'ADMIN' } } as AuthenticatedRequest,
      '1',
    );

    expect(deleteUserUseCase.execute).toHaveBeenCalledWith('admin', '1');
  });
});
