import { NotFoundException } from '@nestjs/common';
import { CreateProjectUseCase } from './create-project.use-case';
import { ProjectEntity } from '../../domain/entities/project.entity';
import { ProjectTypeEntity } from '../../domain/entities/project-type.entity';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';

describe('CreateProjectUseCase', () => {
  const projectRepository: jest.Mocked<Pick<ProjectRepository, 'create'>> = {
    create: jest.fn(),
  };

  const projectTypeRepository: jest.Mocked<
    Pick<ProjectTypeRepository, 'findById'>
  > = {
    findById: jest.fn(),
  };

  const useCase = new CreateProjectUseCase(
    projectRepository,
    projectTypeRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a project for the leader', async () => {
    projectTypeRepository.findById.mockResolvedValue(
      new ProjectTypeEntity('t1', 'INVESTIGACION', 'Investigación', [
        { key: 'grupo', label: 'Grupo', kind: 'text', required: true },
      ]),
    );
    projectRepository.create.mockResolvedValue(
      new ProjectEntity(
        'p1',
        'SISGELAB',
        'resumen',
        'objetivos',
        't1',
        'c1',
        null,
        { grupo: 'GIS' },
        [],
        [],
        '1',
        'BORRADOR',
      ),
    );

    const result = await useCase.execute('1', {
      title: 'SISGELAB',
      summary: 'resumen',
      objectives: 'objetivos',
      typeId: 't1',
      categoryId: 'c1',
      typeData: { grupo: 'GIS' },
      deliverables: [{ name: 'Entrega 1', scope: 'Alcance' }],
    });

    expect(projectRepository.create).toHaveBeenCalledWith({
      title: 'SISGELAB',
      summary: 'resumen',
      objectives: 'objetivos',
      typeId: 't1',
      categoryId: 'c1',
      programId: null,
      typeData: { grupo: 'GIS' },
      knownSkillIds: undefined,
      deliverables: [{ name: 'Entrega 1', scope: 'Alcance' }],
      leaderId: '1',
    });
    expect(result.status).toBe('BORRADOR');
  });

  it('throws NotFoundException when the project type does not exist', async () => {
    projectTypeRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('1', {
        title: 'SISGELAB',
        summary: 'resumen',
        objectives: 'objetivos',
        typeId: 'missing',
        categoryId: 'c1',
        deliverables: [{ name: 'Entrega 1', scope: 'Alcance' }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
