import { UsersController } from './users.controller';
import type { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import type { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import type { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import type { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import type { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';

describe('UsersController', () => {
  const listUsersUseCase: jest.Mocked<Pick<ListUsersUseCase, 'execute'>> = {
    execute: jest.fn(),
  };
  const getUserByIdUseCase: jest.Mocked<Pick<GetUserByIdUseCase, 'execute'>> = {
    execute: jest.fn(),
  };
  const createUserUseCase: jest.Mocked<Pick<CreateUserUseCase, 'execute'>> = {
    execute: jest.fn(),
  };
  const updateUserUseCase: jest.Mocked<Pick<UpdateUserUseCase, 'execute'>> = {
    execute: jest.fn(),
  };
  const deleteUserUseCase: jest.Mocked<Pick<DeleteUserUseCase, 'execute'>> = {
    execute: jest.fn(),
  };

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
    listUsersUseCase.execute.mockReturnValue({ users: [] });

    expect(controller.list()).toEqual({ users: [] });
    expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('delegates getById to use case', () => {
    getUserByIdUseCase.execute.mockResolvedValue({
      id: '1',
      fullName: 'Ana',
      email: 'ana@example.com',
      role: 'COLABORADOR',
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
    void controller.delete('1');

    expect(deleteUserUseCase.execute).toHaveBeenCalledWith('1');
  });
});
