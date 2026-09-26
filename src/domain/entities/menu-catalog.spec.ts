import { getMenuByRole } from './menu-catalog';

const paths = (role: Parameters<typeof getMenuByRole>[0]) =>
  getMenuByRole(role).map((item) => item.path);

describe('getMenuByRole', () => {
  it('gives the leader access to projects and to their technical profile (RF3)', () => {
    expect(paths('LIDER')).toEqual(['/dashboard', '/proyectos', '/perfil']);
  });

  it('gives the collaborator access to their technical profile', () => {
    expect(paths('COLABORADOR')).toContain('/perfil');
  });

  it('gives the admin access to every area: projects, profiles, users and Excel import', () => {
    expect(paths('ADMIN')).toEqual([
      '/dashboard',
      '/proyectos',
      '/colaboradores',
      '/users',
      '/importar',
      '/settings',
    ]);
  });
});
