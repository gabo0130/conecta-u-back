import { NotFoundException } from '@nestjs/common';
import { AdminGetProjectUseCase } from './admin-get-project.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  buildCollaborator,
  buildProject,
  buildUser,
  createMock,
} from '../../testing/test-doubles.testing';

describe('AdminGetProjectUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();
  const userRepository = createMock<UserRepository>();
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const useCase = new AdminGetProjectUseCase(
    projectRepository,
    userRepository,
    collaboratorRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns any project, without checking the owner, with its leader', async () => {
    projectRepository.findById.mockResolvedValue(
      buildProject({ id: 'p1', leaderId: 'leader-1' }),
    );
    userRepository.findById.mockResolvedValue(
      buildUser({ id: 'leader-1', fullName: 'Laura Méndez', role: 'LIDER' }),
    );
    collaboratorRepository.findByUserId.mockResolvedValue(
      buildCollaborator({ id: 'collab-9', userId: 'leader-1' }),
    );

    const project = await useCase.execute('p1');

    expect(project.id).toBe('p1');
    expect(project.leader).toMatchObject({
      fullName: 'Laura Méndez',
      collaboratorId: 'collab-9',
    });
  });

  it('marks the leader without technical profile', async () => {
    projectRepository.findById.mockResolvedValue(buildProject());
    userRepository.findById.mockResolvedValue(
      buildUser({ id: 'leader-1', role: 'LIDER' }),
    );
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    const project = await useCase.execute('project-1');

    expect(project.leader?.collaboratorId).toBeNull();
  });

  it('returns null as leader when the account no longer exists', async () => {
    projectRepository.findById.mockResolvedValue(buildProject());
    userRepository.findById.mockResolvedValue(null);
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    const project = await useCase.execute('project-1');

    expect(project.leader).toBeNull();
  });

  it('throws 404 when the project does not exist', async () => {
    projectRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
