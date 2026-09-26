import { AdminController } from './admin.controller';
import type { AdminGetCollaboratorUseCase } from '../../application/use-cases/admin-get-collaborator.use-case';
import type { AdminGetProjectUseCase } from '../../application/use-cases/admin-get-project.use-case';
import type { AdminListCollaboratorsUseCase } from '../../application/use-cases/admin-list-collaborators.use-case';
import type { AdminListProjectsUseCase } from '../../application/use-cases/admin-list-projects.use-case';
import { createMock } from '../../testing/test-doubles.testing';

describe('AdminController', () => {
  const listProjects = createMock<AdminListProjectsUseCase>();
  const getProject = createMock<AdminGetProjectUseCase>();
  const listCollaborators = createMock<AdminListCollaboratorsUseCase>();
  const getCollaborator = createMock<AdminGetCollaboratorUseCase>();
  const controller = new AdminController(
    listProjects,
    getProject,
    listCollaborators,
    getCollaborator,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates the project routes to their use cases', () => {
    void controller.listProjects();
    void controller.getProject('p1');

    expect(listProjects.execute).toHaveBeenCalledTimes(1);
    expect(getProject.execute).toHaveBeenCalledWith('p1');
  });

  it('delegates the collaborator routes to their use cases', () => {
    void controller.listCollaborators();
    void controller.getCollaborator('c1');

    expect(listCollaborators.execute).toHaveBeenCalledTimes(1);
    expect(getCollaborator.execute).toHaveBeenCalledWith('c1');
  });
});
