import { AdminListCollaboratorsUseCase } from './admin-list-collaborators.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  buildCollaborator,
  buildCollaboratorSkill,
  buildExperience,
  buildUser,
  createMock,
} from '../../testing/test-doubles.testing';

describe('AdminListCollaboratorsUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const userRepository = createMock<UserRepository>();
  const useCase = new AdminListCollaboratorsUseCase(
    collaboratorRepository,
    userRepository,
  );

  it('lists people with and without account, with their counters', async () => {
    collaboratorRepository.findAll.mockResolvedValue({
      items: [
        buildCollaborator({
          id: 'c1',
          userId: 'user-1',
          skills: [buildCollaboratorSkill()],
          experiences: [buildExperience()],
        }),
        buildCollaborator({ id: 'c2', userId: null, source: 'IMPORTACION' }),
      ],
      total: 2,
    });
    userRepository.findByIds.mockResolvedValue([
      buildUser({ id: 'user-1', fullName: 'Ana Pérez', role: 'COLABORADOR' }),
    ]);

    const { collaborators, meta } = await useCase.execute({
      page: 1,
      pageSize: 20,
    });

    expect(userRepository.findByIds).toHaveBeenCalledWith(['user-1']);
    expect(collaborators[0]).toMatchObject({
      id: 'c1',
      skillsCount: 1,
      experiencesCount: 1,
      user: { id: 'user-1', fullName: 'Ana Pérez', role: 'COLABORADOR' },
    });
    expect(collaborators[1]).toMatchObject({
      id: 'c2',
      source: 'IMPORTACION',
      user: null,
    });
    expect(meta).toEqual({ page: 1, pageSize: 20, total: 2, totalPages: 1 });
  });
});
