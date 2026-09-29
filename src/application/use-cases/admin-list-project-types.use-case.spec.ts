import { AdminListProjectTypesUseCase } from './admin-list-project-types.use-case';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import {
  buildProjectType,
  createMock,
} from '../../testing/test-doubles.testing';

describe('AdminListProjectTypesUseCase', () => {
  const projectTypeRepository = createMock<ProjectTypeRepository>();
  const useCase = new AdminListProjectTypesUseCase(projectTypeRepository);

  beforeEach(() => jest.clearAllMocks());

  it('lists all project types, including inactive ones', async () => {
    projectTypeRepository.findAll.mockResolvedValue([
      buildProjectType({ active: false }),
    ]);

    const result = await useCase.execute();

    expect(projectTypeRepository.findAll).toHaveBeenCalledWith(false);
    expect(result.projectTypes).toHaveLength(1);
  });
});
