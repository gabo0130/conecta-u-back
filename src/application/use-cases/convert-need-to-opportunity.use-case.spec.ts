import {
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import type { CreateProjectRepositoryDto } from '../../domain/repositories/project.repository.interface';
import {
  buildNeed,
  buildProject,
  createFakeUnitOfWork,
  createMock,
} from '../../testing/test-doubles.testing';
import type { CreateProjectDto } from '../dto/create-project.dto';
import { ConvertNeedToOpportunityUseCase } from './convert-need-to-opportunity.use-case';
import type { CreateProjectUseCase } from './create-project.use-case';

describe('ConvertNeedToOpportunityUseCase (T5)', () => {
  const needRepository = createMock<NeedRepository>();
  const { unitOfWork, repositories } = createFakeUnitOfWork();
  const createProject = createMock<Pick<CreateProjectUseCase, 'prepare'>>();
  const useCase = new ConvertNeedToOpportunityUseCase(
    needRepository,
    unitOfWork,
    createProject as unknown as CreateProjectUseCase,
  );
  const dto = { title: 'Plataforma de citas' } as CreateProjectDto;
  const prepared = {
    title: 'Plataforma de citas',
    leaderId: 'leader-1',
  } as CreateProjectRepositoryDto;

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.run.mockImplementation((work) => work(repositories));
    needRepository.findById.mockResolvedValue(
      buildNeed({ status: 'CARACTERIZADA' }),
    );
    createProject.prepare.mockResolvedValue(prepared);
    repositories.projects.create.mockResolvedValue(
      buildProject({ id: 'project-9' }),
    );
    repositories.needs.markConverted.mockResolvedValue(
      buildNeed({ status: 'CONVERTIDA', projectId: 'project-9' }),
    );
  });

  it('crea el proyecto con las validaciones de POST /projects y enlaza la necesidad', async () => {
    const result = await useCase.execute('leader-1', 'need-1', dto);

    expect(createProject.prepare).toHaveBeenCalledWith(
      { userId: 'leader-1', role: 'LIDER' },
      dto,
    );
    expect(repositories.projects.create).toHaveBeenCalledWith(prepared);
    expect(repositories.needs.markConverted).toHaveBeenCalledWith(
      'need-1',
      'project-9',
    );
    expect(result.need).toMatchObject({
      status: 'CONVERTIDA',
      projectId: 'project-9',
    });
    expect(result.project.id).toBe('project-9');
  });

  it('409 y nada escrito si otra petición la convirtió antes', async () => {
    repositories.needs.markConverted.mockResolvedValue(null);
    await expect(useCase.execute('leader-1', 'need-1', dto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('no crea nada si los datos del proyecto no son válidos', async () => {
    createProject.prepare.mockRejectedValue(
      new UnprocessableEntityException({ message: 'Tipo inválido' }),
    );
    await expect(useCase.execute('leader-1', 'need-1', dto)).rejects.toThrow(
      UnprocessableEntityException,
    );
    expect(unitOfWork.run).not.toHaveBeenCalled();
  });

  it('solo el formulador y con la necesidad abierta', async () => {
    await expect(useCase.execute('otro', 'need-1', dto)).rejects.toThrow(
      ForbiddenException,
    );
    needRepository.findById.mockResolvedValue(
      buildNeed({ status: 'DESCARTADA' }),
    );
    await expect(useCase.execute('leader-1', 'need-1', dto)).rejects.toThrow(
      ConflictException,
    );
    expect(createProject.prepare).not.toHaveBeenCalled();
  });
});
