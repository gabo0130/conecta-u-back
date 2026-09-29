import { BadRequestException } from '@nestjs/common';
import { CreateProjectTypeUseCase } from './create-project-type.use-case';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import {
  buildProjectType,
  createMock,
} from '../../testing/test-doubles.testing';

describe('CreateProjectTypeUseCase', () => {
  const projectTypeRepository = createMock<ProjectTypeRepository>();
  const useCase = new CreateProjectTypeUseCase(projectTypeRepository);

  beforeEach(() => jest.clearAllMocks());

  it('creates a project type with its template fields', async () => {
    projectTypeRepository.create.mockResolvedValue(buildProjectType());
    const templateFields = [
      {
        key: 'asignatura',
        label: 'Asignatura',
        kind: 'text' as const,
        required: true,
      },
    ];

    await useCase.execute({ code: 'CURSO', name: 'Curso', templateFields });

    expect(projectTypeRepository.create).toHaveBeenCalledWith({
      code: 'CURSO',
      name: 'Curso',
      templateFields,
    });
  });

  it('rejects duplicated field keys', async () => {
    const templateFields = [
      { key: 'a', label: 'A', kind: 'text' as const, required: true },
      { key: 'a', label: 'A otra vez', kind: 'text' as const, required: false },
    ];

    await expect(
      useCase.execute({ code: 'X', name: 'X', templateFields }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(projectTypeRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a select field without options', async () => {
    const templateFields = [
      {
        key: 'nivel',
        label: 'Nivel',
        kind: 'select' as const,
        required: true,
        options: [],
      },
    ];

    await expect(
      useCase.execute({ code: 'X', name: 'X', templateFields }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
