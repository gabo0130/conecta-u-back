import { AdminController } from './admin.controller';
import type { AdminGetCollaboratorUseCase } from '../../application/use-cases/admin-get-collaborator.use-case';
import type { AdminGetProjectUseCase } from '../../application/use-cases/admin-get-project.use-case';
import type { AdminListCollaboratorsUseCase } from '../../application/use-cases/admin-list-collaborators.use-case';
import type { AdminListProjectsUseCase } from '../../application/use-cases/admin-list-projects.use-case';
import type { AdminUpdateCollaboratorIdentificationUseCase } from '../../application/use-cases/admin-update-collaborator-identification.use-case';
import type { GetExperienceCertificateUseCase } from '../../application/use-cases/get-experience-certificate.use-case';
import type { AdminCreatePersonUseCase } from '../../application/use-cases/admin-create-person.use-case';
import type { AdminUpdatePersonUseCase } from '../../application/use-cases/admin-update-person.use-case';
import { createMock } from '../../testing/test-doubles.testing';

describe('AdminController', () => {
  const listProjects = createMock<AdminListProjectsUseCase>();
  const getProject = createMock<AdminGetProjectUseCase>();
  const listCollaborators = createMock<AdminListCollaboratorsUseCase>();
  const getCollaborator = createMock<AdminGetCollaboratorUseCase>();
  const updateIdentification =
    createMock<AdminUpdateCollaboratorIdentificationUseCase>();
  const getCertificate = createMock<GetExperienceCertificateUseCase>();
  const createPerson = createMock<AdminCreatePersonUseCase>();
  const updatePerson = createMock<AdminUpdatePersonUseCase>();
  const controller = new AdminController(
    listProjects,
    getProject,
    listCollaborators,
    getCollaborator,
    updateIdentification,
    getCertificate,
    createPerson,
    updatePerson,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates the project routes to their use cases', () => {
    const query = { page: 1, pageSize: 20 };
    void controller.listProjects(query);
    void controller.getProject('p1');

    expect(listProjects.execute).toHaveBeenCalledWith(query);
    expect(getProject.execute).toHaveBeenCalledWith('p1');
  });

  it('delegates the collaborator routes to their use cases', () => {
    const query = { page: 1, pageSize: 20 };
    void controller.listCollaborators(query);
    void controller.getCollaborator('c1');

    expect(listCollaborators.execute).toHaveBeenCalledWith(query);
    expect(getCollaborator.execute).toHaveBeenCalledWith('c1');
  });

  it('delegates the identification update to its use case', () => {
    const body = { phone: '3001234567' };
    void controller.updateCollaboratorIdentification('c1', body);

    expect(updateIdentification.execute).toHaveBeenCalledWith('c1', body);
  });

  it('delegates the person management routes (RF17)', () => {
    const create = { email: 'x@y.co' } as never;
    void controller.createPerson(create);
    void controller.updatePersonProfile('c1', { summary: 'x' });
    void controller.setPersonStatus('c1', { active: false });

    expect(createPerson.execute).toHaveBeenCalledWith(create);
    expect(updatePerson.updateProfile).toHaveBeenCalledWith('c1', {
      summary: 'x',
    });
    expect(updatePerson.setStatus).toHaveBeenCalledWith('c1', {
      active: false,
    });
  });
});
