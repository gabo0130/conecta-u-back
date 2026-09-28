import { AdminListProjectsUseCase } from './admin-list-projects.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  buildCollaborator,
  buildProject,
  buildUser,
  createMock,
} from '../../testing/test-doubles.testing';

describe('AdminListProjectsUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();
  const userRepository = createMock<UserRepository>();
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const useCase = new AdminListProjectsUseCase(
    projectRepository,
    userRepository,
    collaboratorRepository,
  );

  const params = { page: 1, pageSize: 20 };

  it('returns every project with its leader and the leader technical profile id', async () => {
    projectRepository.findAll.mockResolvedValue({
      items: [
        buildProject({ id: 'p1', leaderId: 'leader-1' }),
        buildProject({ id: 'p2', leaderId: 'leader-2' }),
      ],
      total: 2,
    });
    userRepository.findByIds.mockResolvedValue([
      buildUser({ id: 'leader-1', fullName: 'Laura Méndez', role: 'LIDER' }),
      buildUser({ id: 'leader-2', fullName: 'Mario Quintero', role: 'LIDER' }),
    ]);
    collaboratorRepository.findByUserIds.mockResolvedValue([
      buildCollaborator({ id: 'collab-9', userId: 'leader-1' }),
      buildCollaborator({ id: 'collab-10', userId: null }),
    ]);

    const { projects, meta } = await useCase.execute(params);

    expect(userRepository.findByIds).toHaveBeenCalledWith([
      'leader-1',
      'leader-2',
    ]);
    expect(projects.map((project) => project.id)).toEqual(['p1', 'p2']);
    expect(projects[0].leader).toEqual({
      id: 'leader-1',
      fullName: 'Laura Méndez',
      email: 'ana@example.com',
      active: true,
      collaboratorId: 'collab-9',
    });
    expect(projects[1].leader?.collaboratorId).toBeNull();
    expect(meta).toEqual({ page: 1, pageSize: 20, total: 2, totalPages: 1 });
  });

  it('returns null as leader when the account no longer exists', async () => {
    projectRepository.findAll.mockResolvedValue({
      items: [buildProject()],
      total: 1,
    });
    userRepository.findByIds.mockResolvedValue([]);
    collaboratorRepository.findByUserIds.mockResolvedValue([]);

    const { projects } = await useCase.execute(params);

    expect(projects[0].leader).toBeNull();
  });
});
