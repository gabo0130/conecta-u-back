import { ListRolesUseCase } from './list-roles.use-case';

describe('ListRolesUseCase', () => {
  it('returns roles catalog', () => {
    const useCase = new ListRolesUseCase();
    const result = useCase.execute();

    expect(result.roles.length).toBeGreaterThan(0);
    expect(result.roles[0]).toHaveProperty('key');
    expect(result.roles[0]).toHaveProperty('name');
    expect(result.roles[0]).toHaveProperty('id');
  });
});
