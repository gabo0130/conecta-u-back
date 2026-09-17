import { AccessController } from './access.controller';
import type { ListRolesUseCase } from '../../application/use-cases/list-roles.use-case';

describe('AccessController', () => {
  it('returns roles from list roles use case', () => {
    const listRolesUseCase: jest.Mocked<Pick<ListRolesUseCase, 'execute'>> = {
      execute: jest.fn().mockReturnValue({
        roles: [{ id: 'role_Admin', key: 'Admin', name: 'Admin' }],
      }),
    };

    const controller = new AccessController(listRolesUseCase);

    expect(controller.listRoles()).toEqual({
      roles: [{ id: 'role_Admin', key: 'Admin', name: 'Admin' }],
    });
    expect(listRolesUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
