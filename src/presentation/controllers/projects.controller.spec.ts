import { ProjectsController } from './projects.controller';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';

function mockUseCase() {
  return { execute: jest.fn() };
}

describe('ProjectsController', () => {
  const createProjectUseCase = mockUseCase();
  const listMyProjectsUseCase = mockUseCase();
  const getProjectByIdUseCase = mockUseCase();
  const updateProjectUseCase = mockUseCase();

  const controller = new ProjectsController(
    createProjectUseCase as never,
    listMyProjectsUseCase as never,
    getProjectByIdUseCase as never,
    updateProjectUseCase as never,
  );

  const request = {
    user: { userId: '1', role: 'LIDER' },
  } as AuthenticatedRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates create to use case', () => {
    const dto = {
      title: 'SISGELAB',
      summary: 'r',
      objectives: 'o',
      typeId: 'type-1',
      categoryId: 'category-1',
      deliverables: [{ name: 'PMV', scope: 'Iteración 1' }],
    };
    void controller.create(request, dto);
    expect(createProjectUseCase.execute).toHaveBeenCalledWith('1', dto);
  });

  it('delegates list to use case', () => {
    void controller.list(request);
    expect(listMyProjectsUseCase.execute).toHaveBeenCalledWith('1');
  });

  it('delegates getById to use case', () => {
    void controller.getById(request, 'p1');
    expect(getProjectByIdUseCase.execute).toHaveBeenCalledWith('1', 'p1');
  });

  it('delegates update to use case', () => {
    const dto = { title: 'v2' };
    void controller.update(request, 'p1', dto);
    expect(updateProjectUseCase.execute).toHaveBeenCalledWith('1', 'p1', dto);
  });
});
