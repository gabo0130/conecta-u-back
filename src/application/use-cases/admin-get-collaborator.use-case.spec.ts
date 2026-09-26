import { NotFoundException } from '@nestjs/common';
import { AdminGetCollaboratorUseCase } from './admin-get-collaborator.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  buildCollaborator,
  buildProject,
  buildUser,
  createMock,
} from '../../testing/test-doubles.testing';

describe('AdminGetCollaboratorUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const userRepository = createMock<UserRepository>();
  const projectRepository = createMock<ProjectRepository>();
  const useCase = new AdminGetCollaboratorUseCase(
    collaboratorRepository,
    userRepository,
    projectRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns the full profile, the linked account and the projects it leads', async () => {
    collaboratorRepository.findById.mockResolvedValue(
      buildCollaborator({ id: 'c1', userId: 'leader-1' }),
    );
    userRepository.findById.mockResolvedValue(
      buildUser({ id: 'leader-1', fullName: 'Laura Méndez', role: 'LIDER' }),
    );
    projectRepository.findByLeaderId.mockResolvedValue([
      buildProject({ id: 'p1', title: 'Visitas empresariales' }),
    ]);

    const detail = await useCase.execute('c1');

    expect(detail).toMatchObject({
      id: 'c1',
      active: true,
      user: { id: 'leader-1', role: 'LIDER' },
      ledProjects: [
        { id: 'p1', title: 'Visitas empresariales', status: 'BORRADOR' },
      ],
    });
  });

  it('returns no account nor projects for a person without user (imported)', async () => {
    collaboratorRepository.findById.mockResolvedValue(
      buildCollaborator({ id: 'c2', userId: null }),
    );

    const detail = await useCase.execute('c2');

    expect(detail.user).toBeNull();
    expect(detail.ledProjects).toEqual([]);
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('throws 404 when the profile does not exist', async () => {
    collaboratorRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
