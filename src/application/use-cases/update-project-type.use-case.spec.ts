import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateProjectTypeUseCase } from './update-project-type.use-case';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import {
  buildProjectType,
  createMock,
} from '../../testing/test-doubles.testing';

describe('UpdateProjectTypeUseCase', () => {
  const projectTypeRepository = createMock<ProjectTypeRepository>();
  const useCase = new UpdateProjectTypeUseCase(projectTypeRepository);

  beforeEach(() => jest.clearAllMocks());

  it('updates the type when there is no templateFields to validate', async () => {
    projectTypeRepository.update.mockResolvedValue(
      buildProjectType({ active: false }),
    );

    const result = await useCase.execute('type-1', { active: false });

    expect(projectTypeRepository.update).toHaveBeenCalledWith('type-1', {
      active: false,
    });
    expect(result.active).toBe(false);
  });

  it('validates templateFields before updating', async () => {
    const templateFields = [
      { key: 'a', label: 'A', kind: 'text' as const, required: true },
      { key: 'a', label: 'A otra vez', kind: 'text' as const, required: false },
    ];

    await expect(
      useCase.execute('type-1', { templateFields }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(projectTypeRepository.update).not.toHaveBeenCalled();
  });

  it('throws 404 when the type does not exist', async () => {
    projectTypeRepository.update.mockResolvedValue(null);

    await expect(
      useCase.execute('missing', { active: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
